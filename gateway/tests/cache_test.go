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

// --- Real quota ---

func TestQuotaKey(t *testing.T) {
	key := core.QuotaKey("fmp", 24*time.Hour)
	if !strings.HasPrefix(key, "quota:fmp:") {
		t.Errorf("unexpected daily key: %q", key)
	}

	minuteKey := core.QuotaKey("massive", time.Minute)
	dailyKey := core.QuotaKey("fmp", 24*time.Hour)
	if len(minuteKey) <= len(dailyKey) {
		t.Errorf("minute key should be longer than daily key: %q vs %q", minuteKey, dailyKey)
	}
}

func TestIncrAndCheckQuota(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	count, err := s.CheckQuota(ctx, "fmp", 24*time.Hour)
	if err != nil || count != 0 {
		t.Fatalf("expected 0, got %d err=%v", count, err)
	}

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

// --- Front door quota ---

func TestFrontDoorQuotaKey(t *testing.T) {
	// Front door key must use a different prefix from the real quota key.
	fdKey := core.FrontDoorQuotaKey("fmp", 24*time.Hour)
	realKey := core.QuotaKey("fmp", 24*time.Hour)

	if !strings.HasPrefix(fdKey, "quotafd:fmp:") {
		t.Errorf("unexpected front door key: %q", fdKey)
	}
	if fdKey == realKey {
		t.Errorf("front door key must differ from real quota key, both are %q", fdKey)
	}
}

func TestIncrAndCheckFrontDoorQuota(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	count, err := s.CheckFrontDoorQuota(ctx, "fmp", 24*time.Hour)
	if err != nil || count != 0 {
		t.Fatalf("expected 0, got %d err=%v", count, err)
	}

	for i := int64(1); i <= 3; i++ {
		n, err := s.IncrFrontDoorQuota(ctx, "fmp", 24*time.Hour)
		if err != nil {
			t.Fatal(err)
		}
		if n != i {
			t.Errorf("IncrFrontDoorQuota returned %d, want %d", n, i)
		}
	}

	count, err = s.CheckFrontDoorQuota(ctx, "fmp", 24*time.Hour)
	if err != nil || count != 3 {
		t.Fatalf("expected 3, got %d err=%v", count, err)
	}
}

func TestFrontDoorAndRealQuotaAreIndependent(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	// Incrementing the front door counter must not affect the real counter.
	s.IncrFrontDoorQuota(ctx, "fmp", 24*time.Hour)
	s.IncrFrontDoorQuota(ctx, "fmp", 24*time.Hour)

	real, _ := s.CheckQuota(ctx, "fmp", 24*time.Hour)
	fd, _ := s.CheckFrontDoorQuota(ctx, "fmp", 24*time.Hour)

	if real != 0 {
		t.Errorf("real quota should be 0, got %d", real)
	}
	if fd != 2 {
		t.Errorf("front door quota should be 2, got %d", fd)
	}
}

func TestFrontDoorQuotaWindowExpiry(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()

	if _, err := s.IncrFrontDoorQuota(ctx, "massive", time.Minute); err != nil {
		t.Fatal(err)
	}

	mr.FastForward(2 * time.Minute)

	count, err := s.CheckFrontDoorQuota(ctx, "massive", time.Minute)
	if err != nil || count != 0 {
		t.Errorf("expected 0 after window expiry, got %d err=%v", count, err)
	}
}

// --- AllQuotaStatus ---

func TestAllQuotaStatus(t *testing.T) {
	s, _ := newTestStore(t)
	ctx := context.Background()

	s.IncrQuota(ctx, "fmp", 24*time.Hour)
	s.IncrQuota(ctx, "fmp", 24*time.Hour)
	s.IncrFrontDoorQuota(ctx, "fmp", 24*time.Hour)

	status := s.AllQuotaStatus(ctx)

	if _, ok := status["fmp"]; !ok {
		t.Fatal("fmp missing from quota status")
	}

	fmp := status["fmp"]
	if fmp["used"] != int64(2) {
		t.Errorf("fmp used=%v, want 2", fmp["used"])
	}
	if fmp["limit"] != int64(250) {
		t.Errorf("fmp limit=%v, want 250", fmp["limit"])
	}
	if fmp["frontDoorUsed"] != int64(1) {
		t.Errorf("fmp frontDoorUsed=%v, want 1", fmp["frontDoorUsed"])
	}
	if fmp["frontDoorLimit"] != int64(200) {
		t.Errorf("fmp frontDoorLimit=%v, want 200", fmp["frontDoorLimit"])
	}

	for api := range core.Quotas {
		if _, ok := status[api]; !ok {
			t.Errorf("api %q missing from quota status", api)
		}
	}
}
