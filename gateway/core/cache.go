package core

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Store holds the Redis client used for both response caching and quota tracking.
type Store struct {
	rdb *redis.Client
}

// NewStore creates a Store connected to the Redis instance at addr.
func NewStore(addr string) *Store {
	return &Store{
		rdb: redis.NewClient(&redis.Options{Addr: addr}),
	}
}

// Ping checks the Redis connection. Used for startup health checks.
func (s *Store) Ping(ctx context.Context) error {
	return s.rdb.Ping(ctx).Err()
}

// CacheKey returns the Redis key for a cached API response.
func CacheKey(path, query string) string {
	if query != "" {
		return "cache:" + path + "?" + query
	}
	return "cache:" + path
}

// GetCache returns the cached response body for the given path and query.
// Returns ("", false, nil) on a cache miss.
func (s *Store) GetCache(ctx context.Context, path, query string) (string, bool, error) {
	val, err := s.rdb.Get(ctx, CacheKey(path, query)).Result()
	if err == redis.Nil {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return val, true, nil
}

// SetCache stores a response body in Redis with the given TTL.
func (s *Store) SetCache(ctx context.Context, path, query, body string, ttl time.Duration) error {
	return s.rdb.Set(ctx, CacheKey(path, query), body, ttl).Err()
}

// QuotaKey returns the Redis key for an API's quota counter within the current
// window. Daily quotas are keyed by date; per-minute by date+hour+minute.
func QuotaKey(api string, window time.Duration) string {
	now := time.Now().UTC()
	switch {
	case window >= 24*time.Hour:
		return fmt.Sprintf("quota:%s:%s", api, now.Format("2006-01-02"))
	case window >= time.Minute:
		return fmt.Sprintf("quota:%s:%s", api, now.Format("2006-01-02T15:04"))
	default:
		return fmt.Sprintf("quota:%s:%s", api, now.Format("2006-01-02T15:04:05"))
	}
}

// CheckQuota returns the current usage count for an API within its window.
// Returns 0 if no calls have been made yet.
func (s *Store) CheckQuota(ctx context.Context, api string, window time.Duration) (int64, error) {
	val, err := s.rdb.Get(ctx, QuotaKey(api, window)).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return val, err
}

// IncrQuota increments the quota counter for an API and sets the TTL on first
// use so the counter resets naturally at the end of the window. Returns the
// new count.
func (s *Store) IncrQuota(ctx context.Context, api string, window time.Duration) (int64, error) {
	key := QuotaKey(api, window)
	count, err := s.rdb.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	// Set expiry only on first increment. A small buffer prevents the key from
	// expiring in the middle of its window due to clock skew.
	if count == 1 {
		s.rdb.Expire(ctx, key, window+window/10)
	}
	return count, nil
}

// AllQuotaStatus returns the current usage for every tracked API as a map of
// api → { "used", "limit", "window" }.
func (s *Store) AllQuotaStatus(ctx context.Context) map[string]map[string]any {
	result := make(map[string]map[string]any, len(Quotas))
	for api, q := range Quotas {
		used, _ := s.CheckQuota(ctx, api, q.Window)
		result[api] = map[string]any{
			"used":   used,
			"limit":  q.Limit,
			"window": q.Window.String(),
		}
	}
	return result
}
