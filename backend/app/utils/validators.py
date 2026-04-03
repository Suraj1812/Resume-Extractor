from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Iterable

import regex
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse

EMAIL_PATTERN = regex.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", regex.IGNORECASE)
PHONE_PATTERN = regex.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}"
)
DATE_RANGE_PATTERN = regex.compile(
    r"(?P<start>(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4})"
    r"\s*(?:-|–|to)\s*"
    r"(?P<end>(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}))",
    regex.IGNORECASE,
)
EDUCATION_PATTERN = regex.compile(
    r"(bachelor|master|mba|phd|doctorate|b\.s\.|b\.a\.|m\.s\.|m\.a\.|b\.tech|m\.tech|b\.voc|bvoc)",
    regex.IGNORECASE,
)

SKILL_KEYWORDS = [
    "Python",
    "PyTorch",
    "Transformers",
    "spaCy",
    "FastAPI",
    "Django",
    "Flask",
    "TensorFlow",
    "Scikit-learn",
    "Pandas",
    "NumPy",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Linux",
    "Git",
    "CI/CD",
    "JavaScript",
    "TypeScript",
    "Angular",
    "React",
    "Redux",
    "Next.js",
    "Node.js",
    "NestJS",
    ".NET Core",
    "Go",
    "Tailwind",
    "TailwindCSS",
    "HTML",
    "CSS",
    "NLP",
    "Machine Learning",
    "Deep Learning",
    "REST",
    "GraphQL",
    "Firebase",
    "OpenAI APIs",
    "Prompt Engineering",
    "RAG",
    "RAG Systems",
    "Vector Databases",
    "LangChain",
    "Embeddings",
    "AI Agents",
    "AI Chatbots",
    "Automation Workflows",
]

SECTION_ALIASES = {
    "summary": "summary",
    "professional summary": "summary",
    "career objective": "summary",
    "objective": "summary",
    "profile": "summary",
    "skills": "skills",
    "technical skills": "skills",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "work history": "experience",
    "employment history": "experience",
    "education": "education",
    "academic background": "education",
}

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".text"}
SUPPORTED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream",
}

logger = logging.getLogger("resume_extractor.validation")


@dataclass
class AppError(Exception):
    status_code: int
    code: str
    message: str


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        logger.warning("handled_application_error", extra={"code": exc.code, "error_message": exc.message})
        return ORJSONResponse(
            {"error": {"code": exc.code, "message": exc.message}},
            status_code=exc.status_code,
            headers={"X-Request-ID": getattr(request.state, "request_id", "")},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        logger.warning("request_validation_failed", extra={"errors": exc.errors()})
        return ORJSONResponse(
            {"error": {"code": "validation_error", "message": "Request validation failed."}},
            status_code=422,
            headers={"X-Request-ID": getattr(request.state, "request_id", "")},
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        logger.exception("unhandled_exception", exc_info=exc)
        return ORJSONResponse(
            {"error": {"code": "internal_error", "message": "An unexpected error occurred."}},
            status_code=500,
            headers={"X-Request-ID": getattr(request.state, "request_id", "")},
        )


def validate_upload(filename: str, content_size: int, max_upload_mb: int, content_type: str = "") -> None:
    if not filename:
        raise AppError(status_code=400, code="missing_filename", message="Uploaded file must have a filename.")

    if content_size <= 0:
        raise AppError(status_code=400, code="empty_file", message="Uploaded file is empty.")

    if content_size > max_upload_mb * 1024 * 1024:
        raise AppError(
            status_code=413,
            code="file_too_large",
            message=f"File exceeds the {max_upload_mb} MB upload limit.",
        )

    extension_parts = filename.lower().rsplit(".", 1)
    extension = f".{extension_parts[-1]}" if len(extension_parts) > 1 else ""
    if extension not in SUPPORTED_EXTENSIONS:
        raise AppError(
            status_code=415,
            code="unsupported_file_type",
            message="Only PDF, DOCX, and TXT files are supported.",
        )

    if content_type and content_type.lower() not in SUPPORTED_CONTENT_TYPES:
        raise AppError(
            status_code=415,
            code="unsupported_content_type",
            message="The uploaded file content type is not supported.",
        )


def clean_text(text: str) -> str:
    normalized = text.replace("\r", "\n").replace("\t", " ").replace("\u00a0", " ").strip()
    normalized = regex.sub(r"[ \f\v]+", " ", normalized)
    normalized = regex.sub(r" *\n", "\n", normalized)
    normalized = regex.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def split_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def dedupe(values: Iterable[str]) -> list[str]:
    items: list[str] = []
    seen: set[str] = set()

    for value in values:
        normalized = value.strip()
        key = normalized.lower()
        if not normalized or key in seen:
            continue
        seen.add(key)
        items.append(normalized)

    return items


def extract_email(text: str) -> str:
    match = EMAIL_PATTERN.search(text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    match = PHONE_PATTERN.search(text)
    return match.group(0) if match else ""


def extract_sections(text: str) -> dict[str, str]:
    sections: dict[str, list[str]] = {"header": []}
    current = "header"

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            sections.setdefault(current, []).append("")
            continue

        alias, before, after = _split_section_heading(line)
        if alias:
            if before:
                sections.setdefault(current, []).append(before)
            current = alias
            sections.setdefault(current, [])
            if after:
                sections[current].append(after)
            continue

        sections.setdefault(current, []).append(line)

    return {
        key: "\n".join(lines).strip()
        for key, lines in sections.items()
        if any(item.strip() for item in lines)
    }


def split_blocks(section_text: str) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []

    for raw_line in section_text.splitlines():
        line = raw_line.strip()
        if not line:
            if current:
                blocks.append(current)
                current = []
            continue
        current.append(line)

    if current:
        blocks.append(current)

    return blocks


def extract_skills(text: str) -> list[str]:
    lowered = text.lower()
    matches: list[str] = []

    for skill in SKILL_KEYWORDS:
        if regex.search(rf"(?<![\w.+-]){regex.escape(skill.lower())}(?![\w.+-])", lowered):
            matches.append(skill)

    return dedupe(matches)


def parse_date_range(text: str) -> str:
    match = DATE_RANGE_PATTERN.search(text)
    if not match:
        return ""
    return f"{match.group('start')} - {match.group('end')}"


def looks_like_education(text: str) -> bool:
    return bool(EDUCATION_PATTERN.search(text))


def _split_section_heading(line: str) -> tuple[str | None, str, str]:
    cleaned = line.strip()
    normalized = cleaned.lower().rstrip(":")
    alias = SECTION_ALIASES.get(normalized)
    if alias:
        return alias, "", ""

    for heading in sorted(SECTION_ALIASES.keys(), key=len, reverse=True):
        prefix_match = regex.match(
            rf"^{regex.escape(heading)}\s*:?\s+(.+)$",
            cleaned,
            regex.IGNORECASE,
        )
        if prefix_match:
            return SECTION_ALIASES[heading], "", prefix_match.group(1).strip()

        suffix_match = regex.match(
            rf"^(.+?)\s+{regex.escape(heading)}\s*:?$",
            cleaned,
            regex.IGNORECASE,
        )
        if suffix_match:
            return SECTION_ALIASES[heading], suffix_match.group(1).strip(), ""

    return None, "", ""
