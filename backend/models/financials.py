from typing import Any

from pydantic import BaseModel


class FinancialsResponse(BaseModel):
    symbol: str
    metrics: dict[str, dict[str, Any]]
    reported: dict[str, list[Any]]
