from fastapi import APIRouter, HTTPException

import finnhub_service
from models.financials import FinancialsResponse

router = APIRouter(prefix="/api")


@router.get("/financials/{symbol}", response_model=FinancialsResponse)
def get_financials(symbol: str):
    try:
        metrics = finnhub_service.build_metrics(symbol)
        reported = finnhub_service.build_reported(symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Finnhub error: {e}")

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
