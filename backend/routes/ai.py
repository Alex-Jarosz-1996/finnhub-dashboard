import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from core.dependencies import get_current_user
from core.limiter import limiter
from models.ai import ChatRequest, ChatResponse
from services import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def post_chat(
    request: Request,
    body: ChatRequest,
    _=Depends(get_current_user),
):
    try:
        reply = await ai_service.chat(body.message)
    except Exception:
        logger.exception("AI chat error")
        raise HTTPException(status_code=502, detail="AI service error") from None
    return ChatResponse(response=reply)
