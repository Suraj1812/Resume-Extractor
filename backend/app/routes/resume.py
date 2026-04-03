from __future__ import annotations

from fastapi import APIRouter, File, Request, UploadFile
from starlette.concurrency import run_in_threadpool

from ..models.schema import ResumeParseResponse
from ..utils.validators import AppError

router = APIRouter(tags=["resume"])


@router.post("/api/parse-resume", response_model=ResumeParseResponse)
async def parse_resume(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise AppError(status_code=400, code="missing_filename", message="Uploaded file must have a filename.")

    content = await file.read()
    parser_service = request.app.state.parser_service

    return await run_in_threadpool(
        parser_service.parse_resume,
        file.filename,
        file.content_type or "",
        content,
    )
