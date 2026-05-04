package main

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"gateway/core"
)

func main() {
	fastapiURL := getenv("FASTAPI_URL", "http://localhost:8000")
	redisAddr := getenv("REDIS_URL", "localhost:6379")

	db := core.NewStore(redisAddr)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.Ping(ctx); err != nil {
		log.Fatalf("cannot connect to Redis at %s: %v", redisAddr, err)
	}
	log.Printf("connected to Redis at %s", redisAddr)

	target, err := url.Parse(fastapiURL)
	if err != nil {
		log.Fatalf("invalid FASTAPI_URL %q: %v", fastapiURL, err)
	}

	gw := core.NewGateway(db, core.NewProxy(target, db))

	mux := http.NewServeMux()
	mux.HandleFunc("/api/quota/status", gw.HandleQuotaStatus)
	mux.HandleFunc("/api/", gw.HandleAPI)

	log.Printf("gateway listening on :8080 → FastAPI at %s", fastapiURL)
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
