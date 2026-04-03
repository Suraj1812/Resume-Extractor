from __future__ import annotations

import platform
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Resume Extractor API"
    log_level: str = "INFO"
    max_upload_mb: int = 5
    model_name: str = "dslim/bert-base-NER"
    model_max_chars: int = 5000
    preload_model: bool = False
    enable_spacy: bool = Field(default_factory=lambda: platform.system() != "Darwin")
    enable_transformers: bool = Field(default_factory=lambda: platform.system() != "Darwin")
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    frontend_export_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parents[2] / "frontend" / "out"
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
