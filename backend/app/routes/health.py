from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(request: Request):
    service = request.app.state.parser_service
    return {
        "status": "ok",
        "service": "resume-extractor-api",
        "model_name": service.ner_service.model_name,
        "model_loaded": service.ner_service.is_ready,
    }
