package core_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"gateway/core"
)

func TestCacheKey(t *testing.T) {
	tests := []struct {
		path, query, want string
	}{
		{"/api/quote/AAPL", "", "cache:/api/quote/AAPL"},
		{"/api/chart/eod/AAPL", "range=1y", "cache:/api/chart/eod/AAPL?range=1y"},
	}
	for _, tt := range tests {
		got := core.CacheKey(tt.path, tt.query)
		if got != tt.want {
			t.Errorf("CacheKey(%q, %q) = %q, want %q", tt.path, tt.query, got, tt.want)
		}
	}
}

func TestGetSetCache(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	// Miss on empty store.
	_, hit, err := s.GetCache(ctx, "/api/quote/AAPL", "")
	if err != nil || hit {
		t.Fatalf("expected miss, got hit=%v err=%v", hit, err)
	}

	// Store a value.
	body := `{"c":150.0}`
	if err := s.SetCache(ctx, "/api/quote/AAPL", "", body, time.Minute); err != nil {
		t.Fatal(err)
	}

	// Hit returns the stored value.
	got, hit, err := s.GetCache(ctx, "/api/quote/AAPL", "")
	if err != nil || !hit {
		t.Fatalf("expected hit, got hit=%v err=%v", hit, err)
	}
	if got != body {
		t.Errorf("got %q, want %q", got, body)
	}
}

func TestCacheExpiry(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()

	if err := s.SetCache(ctx, "/api/quote/AAPL", "", `{}`, 100*time.Millisecond); err != nil {
		t.Fatal(err)
	}

	mr.FastForward(200 * time.Millisecond)

	_, hit, err := s.GetCache(ctx, "/api/quote/AAPL", "")
	if err != nil || hit {
		t.Errorf("expected miss after expiry, got hit=%v err=%v", hit, err)
	}
}

func TestQuotaKey(t *testing.T) {
	// Daily quota key contains the date.
	key := core.QuotaKey("fmp", 24*time.Hour)
	if !strings.HasPrefix(key, "quota:fmp:") {
		t.Errorf("unexpected daily key: %q", key)
	}

	// Per-minute key is more granular (longer) than daily.
	minuteKey := core.QuotaKey("massive", time.Minute)
	dailyKey := core.QuotaKey("fmp", 24*time.Hour)
	if len(minuteKey) <= len(dailyKey) {
		t.Errorf("minute key should be longer than daily key: %q vs %q", minuteKey, dailyKey)
	}
}

func TestIncrAndCheckQuota(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	// Zero before any increments.
	count, err := s.CheckQuota(ctx, "fmp", 24*time.Hour)
	if err != nil || count != 0 {
		t.Fatalf("expected 0, got %d err=%v", count, err)
	}

	// Increment three times and verify the running total.
	for i := int64(1); i <= 3; i++ {
		n, err := s.IncrQuota(ctx, "fmp", 24*time.Hour)
		if err != nil {
			t.Fatal(err)
		}
		if n != i {
			t.Errorf("IncrQuota returned %d, want %d", n, i)
		}
	}

	count, err = s.CheckQuota(ctx, "fmp", 24*time.Hour)
	if err != nil || count != 3 {
		t.Fatalf("expected 3, got %d err=%v", count, err)
	}
}

func TestQuotaWindowExpiry(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()

	if _, err := s.IncrQuota(ctx, "massive", time.Minute); err != nil {
		t.Fatal(err)
	}

	mr.FastForward(2 * time.Minute)

	count, err := s.CheckQuota(ctx, "massive", time.Minute)
	if err != nil || count != 0 {
		t.Errorf("expected 0 after window expiry, got %d err=%v", count, err)
	}
}

func TestAllQuotaStatus(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	s.IncrQuota(ctx, "fmp", 24*time.Hour)
	s.IncrQuota(ctx, "fmp", 24*time.Hour)

	status := s.AllQuotaStatus(ctx)

	if _, ok := status["fmp"]; !ok {
		t.Fatal("fmp missing from quota status")
	}
	if status["fmp"]["used"] != int64(2) {
		t.Errorf("fmp used=%v, want 2", status["fmp"]["used"])
	}
	if status["fmp"]["limit"] != int64(250) {
		t.Errorf("fmp limit=%v, want 250", status["fmp"]["limit"])
	}

	// All configured APIs must appear.
	for api := range core.Quotas {
		if _, ok := status[api]; !ok {
			t.Errorf("api %q missing from quota status", api)
		}
	}
}
