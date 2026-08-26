"""
AI 教程助手 — FastAPI 路由
"""

import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from ai_service import chat, chat_stream, get_suggestions, is_configured

logger = logging.getLogger("ai_routes")
router = APIRouter(prefix="/api/v1/ai", tags=["AI助手"])


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[dict]] = None


class ChatResponse(BaseModel):
    code: int = 0
    message: str = "ok"
    data: dict


@router.get("/status")
async def ai_status():
    """检查 AI 服务状态"""
    return {
        "code": 0,
        "data": {
            "configured": is_configured(),
            "mode": "llm" if is_configured() else "fallback",
            "suggestions": get_suggestions(),
        }
    }


@router.get("/suggestions")
async def ai_suggestions():
    """获取推荐问题列表"""
    return {
        "code": 0,
        "data": {"suggestions": get_suggestions()}
    }


@router.post("/chat")
async def ai_chat(req: ChatRequest):
    """发送消息，获取 AI 回复"""
    if not req.message or not req.message.strip():
        return {"code": -1, "message": "消息不能为空", "data": None}

    try:
        reply = await chat(req.message, req.history)
        return {
            "code": 0,
            "message": "ok",
            "data": {"reply": reply}
        }
    except Exception as e:
        logger.error(f"聊天失败: {e}")
        return {"code": -1, "message": str(e), "data": None}


@router.post("/chat/stream")
async def ai_chat_stream(req: ChatRequest):
    """流式聊天 — SSE"""
    if not req.message or not req.message.strip():
        return StreamingResponse(
            iter(["data: 消息不能为空\n\n"]),
            media_type="text/event-stream"
        )

    async def generate():
        try:
            async for token in chat_stream(req.message, req.history):
                # SSE 格式: data: <content>\n\n
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"流式聊天失败: {e}")
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
