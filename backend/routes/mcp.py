import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from core.dependencies import get_current_user
from core.limiter import limiter
from models.mcp import MCPToolCallRequest, MCPToolCallResponse
from services import mcp_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/mcp")


@router.get("/tools")
@limiter.limit("20/minute")
async def get_tools(request: Request, _=Depends(get_current_user)):
    try:
        return await mcp_service.list_tools()
    except Exception:
        logger.exception("Failed to list FMP MCP tools")
        raise HTTPException(
            status_code=502, detail="Failed to reach FMP MCP server"
        ) from None


@router.post("/call", response_model=MCPToolCallResponse)
@limiter.limit("20/minute")
async def call_tool(
    request: Request, body: MCPToolCallRequest, _=Depends(get_current_user)
):
    try:
        result = await mcp_service.call_tool(body.name, body.arguments)
    except Exception:
        logger.exception("Failed to call FMP MCP tool '%s'", body.name)
        raise HTTPException(
            status_code=502, detail="Failed to reach FMP MCP server"
        ) from None
    return MCPToolCallResponse(result=result)
