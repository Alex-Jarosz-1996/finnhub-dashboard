from fastapi import APIRouter, HTTPException

import finnhub_service
from models.quote import QuoteResponse

router = APIRouter(prefix="/api")


@router.get("/quote/{symbol}", response_model=QuoteResponse)
def get_quote(symbol: str):
    try:
        data = finnhub_service.get_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Finnhub error: {e}")

    if not data or data.get("c") == 0:
        raise HTTPException(
            status_code=404, detail=f"No data found for symbol '{symbol.upper()}'"
        )

    return QuoteResponse(
        symbol=symbol.upper(),
        current=data.get("c"),
        high=data.get("h"),
        low=data.get("l"),
        open=data.get("o"),
    )
