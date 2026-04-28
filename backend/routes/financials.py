import logging

from fastapi import APIRouter, Depends, HTTPException, Path, Request

from core.dependencies import get_current_user
from core.limiter import limiter
from models.financials import FinancialsResponse
from services import finnhub_service
from services.finnhub_service import FinnhubRateLimitError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/financials/{symbol}", response_model=FinancialsResponse)
@limiter.limit("30/minute")
def get_financials(
    request: Request,
    symbol: str = Path(..., pattern=r"^[A-Za-z.]{1,10}$"),
    _=Depends(get_current_user),
):
    try:
        metrics = finnhub_service.build_metrics(symbol)
        reported = finnhub_service.build_reported(symbol)
    except FinnhubRateLimitError:
        raise HTTPException(
            status_code=429,
            detail="Finnhub rate limit exceeded, please try again shortly",
        ) from None
    except Exception:
        logger.exception("Finnhub error fetching financials for %s", symbol)
        raise HTTPException(
            status_code=502, detail="Failed to fetch financial data"
        ) from None

    if not any(
        any(v is not None for v in group.values()) for group in metrics.values()
    ):
        raise HTTPException(
            status_code=404,
            detail=f"No financial data found for symbol '{symbol.upper()}'",
        )

    return FinancialsResponse(
        symbol=symbol.upper(),
        metrics=metrics,
        reported=reported,
    )
