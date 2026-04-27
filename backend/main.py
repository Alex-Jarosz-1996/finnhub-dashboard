from fastapi import FastAPI

from middleware.cors import register_cors
from routes.financials import router as financials_router
from routes.quote import router as quote_router

app = FastAPI(title="Finnhub Dashboard API")

register_cors(app)
app.include_router(quote_router)
app.include_router(financials_router)
