from typing import Optional

from pydantic import BaseModel


class QuoteResponse(BaseModel):
    symbol: str
    current: Optional[float]
    high: Optional[float]
    low: Optional[float]
    open: Optional[float]
