package core_test

import (
	"testing"
	"time"

	"gateway/core"
)

func TestRuleFor(t *testing.T) {
	tests := []struct {
		path        string
		wantAPI     string
		wantTTL     time.Duration
		wantMatched bool
	}{
		{"/api/chart/eod/AAPL", "fmp", 24 * time.Hour, true},
		{"/api/chart/intraday/AAPL", "stockdata", 5 * time.Minute, true},
		{"/api/options/AAPL", "massive", 5 * time.Minute, true},
		{"/api/quote/AAPL", "finnhub", 15 * time.Minute, true},
		{"/api/financials/AAPL", "finnhub", 15 * time.Minute, true},
		{"/api/chat", "", 0, true},
		{"/api/auth/login", "", 0, true},
		{"/api/unknown/path", "", 0, false},
		// Ensure eod prefix wins over a shorter match.
		{"/api/chart/eod/MSFT", "fmp", 24 * time.Hour, true},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			rule, ok := core.RuleFor(tt.path)
			if ok != tt.wantMatched {
				t.Fatalf("RuleFor(%q) matched=%v, want %v", tt.path, ok, tt.wantMatched)
			}
			if !ok {
				return
			}
			if rule.API != tt.wantAPI {
				t.Errorf("API=%q, want %q", rule.API, tt.wantAPI)
			}
			if rule.CacheTTL != tt.wantTTL {
				t.Errorf("CacheTTL=%v, want %v", rule.CacheTTL, tt.wantTTL)
			}
		})
	}
}
