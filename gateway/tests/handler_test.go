package core_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"gateway/core"
)

func TestHandleQuotaStatus(t *testing.T) {
	gw, _ := newTestGateway(t)

	req := httptest.NewRequest(http.MethodGet, "/api/quota/status", nil)
	w := httptest.NewRecorder()
	gw.HandleQuotaStatus(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d, want 200", w.Code)
	}

	var result map[string]map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	for api := range core.Quotas {
		if _, ok := result[api]; !ok {
			t.Errorf("api %q missing from quota status response", api)
		}
	}
}

func TestHandleAPI_ProxiesToUpstream(t *testing.T) {
	gw, _ := newTestGateway(t)

	req := httptest.NewRequest(http.MethodGet, "/api/quote/AAPL", nil)
	w := httptest.NewRecorder()
	gw.HandleAPI(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d, want 200", w.Code)
	}
	if w.Header().Get("X-Cache") == "HIT" {
		t.Error("first request should not be a cache hit")
	}
}

func TestHandleAPI_CacheHit(t *testing.T) {
	gw, upstream := newTestGateway(t)
	upstreamCalls := 0
	upstream.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamCalls++
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"c":150.0}`))
	})

	// First request populates the cache.
	req1 := httptest.NewRequest(http.MethodGet, "/api/quote/AAPL", nil)
	gw.HandleAPI(httptest.NewRecorder(), req1)

	// Second request should be served from cache.
	req2 := httptest.NewRequest(http.MethodGet, "/api/quote/AAPL", nil)
	w2 := httptest.NewRecorder()
	gw.HandleAPI(w2, req2)

	if w2.Header().Get("X-Cache") != "HIT" {
		t.Error("second request should be a cache hit")
	}
	if upstreamCalls != 1 {
		t.Errorf("upstream called %d times, want 1", upstreamCalls)
	}
}

func TestHandleAPI_QuotaExceeded(t *testing.T) {
	gw, _ := newTestGateway(t)
	ctx := context.Background()

	// Exhaust the FMP quota.
	q := core.Quotas["fmp"]
	for i := int64(0); i < q.Limit; i++ {
		gw.Store.IncrQuota(ctx, "fmp", q.Window)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/chart/eod/AAPL", nil)
	w := httptest.NewRecorder()
	gw.HandleAPI(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("status=%d, want 429", w.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["api"] != "fmp" {
		t.Errorf("error body api=%v, want fmp", body["api"])
	}
}

func TestHandleAPI_CacheBypassesQuotaCheck(t *testing.T) {
	gw, _ := newTestGateway(t)
	ctx := context.Background()

	// Pre-populate the cache.
	gw.Store.SetCache(ctx, "/api/chart/eod/AAPL", "", `{"data":"cached"}`, time.Hour)

	// Exhaust the FMP quota.
	q := core.Quotas["fmp"]
	for i := int64(0); i < q.Limit; i++ {
		gw.Store.IncrQuota(ctx, "fmp", q.Window)
	}

	// Cache hit should return 200 even with quota exhausted.
	req := httptest.NewRequest(http.MethodGet, "/api/chart/eod/AAPL", nil)
	w := httptest.NewRecorder()
	gw.HandleAPI(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status=%d, want 200 (cache hit should bypass quota)", w.Code)
	}
	if w.Header().Get("X-Cache") != "HIT" {
		t.Error("expected X-Cache: HIT")
	}
}

func TestHandleAPI_AuthBypassesCache(t *testing.T) {
	gw, _ := newTestGateway(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	w := httptest.NewRecorder()
	gw.HandleAPI(w, req)

	if w.Header().Get("X-Cache") == "HIT" {
		t.Error("auth routes must not be served from cache")
	}
}

func TestHandleAPI_UnknownPath(t *testing.T) {
	gw, _ := newTestGateway(t)

	req := httptest.NewRequest(http.MethodGet, "/api/unknown/endpoint", nil)
	w := httptest.NewRecorder()
	gw.HandleAPI(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status=%d, want 200", w.Code)
	}
}
