import logging

from fastapi import APIRouter, Depends, HTTPException, Path

import finnhub_service
from dependencies import get_current_user
from finnhub_service import FinnhubRateLimitError
from models.quote import QuoteResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/quote/{symbol}", response_model=QuoteResponse)
def get_quote(
    symbol: str = Path(..., pattern=r"^[A-Za-z.]{1,10}$"),
    _=Depends(get_current_user),
):
    try:
        data = finnhub_service.get_quote(symbol)
    except FinnhubRateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Finnhub rate limit exceeded, please try again shortly",
        ) from None
    except Exception:
        logger.exception("Finnhub error fetching quote for %s", symbol)
        raise HTTPException(
            status_code=502, detail="Failed to fetch quote data"
        ) from None

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
