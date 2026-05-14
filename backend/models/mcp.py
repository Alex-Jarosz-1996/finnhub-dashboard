from typing import Any

from pydantic import BaseModel


class MCPToolCallRequest(BaseModel):
    name: str
    arguments: dict[str, Any] = {}


class MCPToolCallResponse(BaseModel):
    result: str
