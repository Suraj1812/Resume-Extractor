from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, ORJSONResponse

from .config import get_settings
from .routes.health import router as health_router
from .routes.resume import router as resume_router
from .services.ner import NERService
from .services.parser import ResumeParserService
from .utils.logger import RequestLoggingMiddleware, configure_logging
from .utils.validators import register_exception_handlers

settings = get_settings()
configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ner_service = NERService(
        model_name=settings.model_name,
        max_chars=settings.model_max_chars,
        enable_transformers=settings.enable_transformers,
        enable_spacy=settings.enable_spacy,
    )
    parser_service = ResumeParserService(settings=settings, ner_service=ner_service)

    if settings.preload_model:
        parser_service.warmup()

    app.state.parser_service = parser_service
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health_router)
app.include_router(resume_router)


def _safe_path(base_dir: Path, requested_path: str) -> Path:
    candidate = (base_dir / requested_path).resolve()
    base = base_dir.resolve()
    if base not in candidate.parents and candidate != base:
        raise HTTPException(status_code=404)
    return candidate


frontend_dir = settings.frontend_export_dir
index_file = frontend_dir / "index.html"

if index_file.exists():
    @app.get("/", include_in_schema=False)
    async def serve_frontend_index():
        return FileResponse(index_file)


    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_asset(full_path: str):
        if full_path == "health" or full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        target = _safe_path(frontend_dir, full_path)
        if target.is_file():
            return FileResponse(target)
        return FileResponse(index_file)
