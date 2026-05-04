package core

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// Gateway is the HTTP handler. It checks the Redis cache, enforces API quotas,
// and proxies requests to the FastAPI backend.
type Gateway struct {
	Store *Store
	Proxy *httputil.ReverseProxy
}

// NewGateway creates a Gateway wired to the given store and proxy.
func NewGateway(store *Store, proxy *httputil.ReverseProxy) *Gateway {
	return &Gateway{Store: store, Proxy: proxy}
}

// HandleAPI is the main entry point for all /api/* requests except /api/quota/status.
func (g *Gateway) HandleAPI(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rule, hasRule := RuleFor(r.URL.Path)

	// Pass through requests that match no rule (unknown paths).
	if !hasRule {
		g.Proxy.ServeHTTP(w, r)
		return
	}

	// Only cache GET requests with a positive TTL.
	shouldCache := rule.CacheTTL > 0 && r.Method == http.MethodGet

	// --- Cache check ---
	if shouldCache {
		if body, hit, err := g.Store.GetCache(ctx, r.URL.Path, r.URL.RawQuery); err == nil && hit {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			w.Write([]byte(body))
			return
		}
	}

	// --- Quota check ---
	if rule.API != "" {
		if q, ok := Quotas[rule.API]; ok {
			used, err := g.Store.CheckQuota(ctx, rule.API, q.Window)
			if err != nil {
				log.Printf("quota check error for %s: %v", rule.API, err)
			} else if used >= q.Limit {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]any{
					"error":  "quota exhausted",
					"api":    rule.API,
					"used":   used,
					"limit":  q.Limit,
					"window": q.Window.String(),
				})
				return
			}
		}
	}

	// Attach the rule to the request context so ModifyResponse in the proxy
	// can access it when deciding what to cache and which quota to increment.
	r = r.WithContext(withRouteRule(ctx, rule))
	g.Proxy.ServeHTTP(w, r)
}

// HandleQuotaStatus serves GET /api/quota/status directly from Redis data.
func (g *Gateway) HandleQuotaStatus(w http.ResponseWriter, r *http.Request) {
	status := g.Store.AllQuotaStatus(r.Context())
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// NewProxy builds a reverse proxy targeting upstream that captures successful
// responses for caching and increments quota counters.
func NewProxy(target *url.URL, db *Store) *httputil.ReverseProxy {
	proxy := httputil.NewSingleHostReverseProxy(target)

	proxy.ModifyResponse = func(resp *http.Response) error {
		if resp.StatusCode != http.StatusOK {
			return nil
		}

		ctx := resp.Request.Context()
		rule, ok := routeRuleFromCtx(ctx)
		if !ok {
			return nil
		}

		// Increment quota counter for the external API this route uses.
		if rule.API != "" {
			if q, ok := Quotas[rule.API]; ok {
				if _, err := db.IncrQuota(ctx, rule.API, q.Window); err != nil {
					log.Printf("quota increment error for %s: %v", rule.API, err)
				}
			}
		}

		// Cache the response body for eligible GET requests.
		if rule.CacheTTL > 0 && resp.Request.Method == http.MethodGet {
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return err
			}
			resp.Body = io.NopCloser(bytes.NewReader(body))

			path := resp.Request.URL.Path
			query := resp.Request.URL.RawQuery
			if err := db.SetCache(ctx, path, query, string(body), rule.CacheTTL); err != nil {
				log.Printf("cache write error for %s: %v", path, err)
			}
		}

		return nil
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Printf("proxy error for %s: %v", r.URL.Path, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{"error": "upstream unavailable"})
	}

	return proxy
}

// --- context helpers (unexported — internal to this package) ---

type ctxKey struct{}

func withRouteRule(ctx context.Context, r RouteRule) context.Context {
	return context.WithValue(ctx, ctxKey{}, r)
}

func routeRuleFromCtx(ctx context.Context) (RouteRule, bool) {
	r, ok := ctx.Value(ctxKey{}).(RouteRule)
	return r, ok
}
