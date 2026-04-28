import logging

from fastapi import APIRouter, Depends, HTTPException, Path, Request

from core.dependencies import get_current_user
from core.limiter import limiter
from models.quote import QuoteResponse
from services import finnhub_service
from services.finnhub_service import FinnhubRateLimitError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/quote/{symbol}", response_model=QuoteResponse)
@limiter.limit("30/minute")
def get_quote(
    request: Request,
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
