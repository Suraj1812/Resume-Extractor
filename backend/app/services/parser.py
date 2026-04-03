from __future__ import annotations

import logging

from ..config import Settings
from ..models.schema import ResumeParseResponse
from ..utils.file_handler import FileHandler
from ..utils.validators import (
    AppError,
    clean_text,
    dedupe,
    extract_email,
    extract_phone,
    extract_sections,
    extract_skills,
    looks_like_education,
    parse_date_range,
    split_blocks,
    split_lines,
    validate_upload,
)
from .ner import NERService, NerEntity

logger = logging.getLogger("resume_extractor.parser")


class ResumeParserService:
    def __init__(self, settings: Settings, ner_service: NERService) -> None:
        self.settings = settings
        self.ner_service = ner_service
        self.file_handler = FileHandler()

    def warmup(self) -> None:
        self.ner_service.warmup()

    def parse_resume(self, filename: str, content_type: str, content: bytes) -> ResumeParseResponse:
        raw_text = self.parse_file(filename=filename, content_type=content_type, content=content)
        normalized_text = self.clean_text(raw_text)

        if not normalized_text:
            raise AppError(
                status_code=422,
                code="empty_extraction",
                message="No readable text was found in the uploaded resume.",
            )

        entities, warnings = self.run_ner(normalized_text)
        payload = self.postprocess(normalized_text, entities)
        response = self.validate(payload)

        if warnings:
            logger.warning(
                "parse_resume_completed_with_warnings",
                extra={"resume_filename": filename, "warnings": warnings},
            )

        return response

    def parse_file(self, filename: str, content_type: str, content: bytes) -> str:
        validate_upload(
            filename=filename,
            content_size=len(content),
            max_upload_mb=self.settings.max_upload_mb,
            content_type=content_type,
        )
        return self.extract_text(filename=filename, content_type=content_type, content=content)

    def extract_text(self, filename: str, content_type: str, content: bytes) -> str:
        del content_type
        return self.file_handler.extract_text(filename=filename, content=content)

    @staticmethod
    def clean_text(text: str) -> str:
        return clean_text(text)

    def run_ner(self, text: str) -> tuple[list[NerEntity], list[str]]:
        return self.ner_service.extract_entities(text)

    def postprocess(self, text: str, entities: list[NerEntity]) -> ResumeParseResponse:
        sections = extract_sections(text)
        header_lines = split_lines(sections.get("header", text))[:8]

        return ResumeParseResponse(
            name=self._extract_name(header_lines, entities),
            email=extract_email(text),
            phone=extract_phone(text),
            skills=self._extract_skills(text, sections),
            education=self._extract_education(text, sections, entities),
            experience=self._extract_experience(text, sections, entities),
        )

    @staticmethod
    def validate(payload: ResumeParseResponse) -> ResumeParseResponse:
        return ResumeParseResponse.model_validate(payload.model_dump())

    def _extract_name(self, header_lines: list[str], entities: list[NerEntity]) -> str:
        header_text = " ".join(header_lines)
        people = [
            entity.text
            for entity in sorted(entities, key=lambda item: item.score, reverse=True)
            if entity.label == "PER" and 1 < len(entity.text.split()) <= 4
        ]

        for person in people:
            if person in header_text:
                return person.strip()

        for line in header_lines:
            lowered = line.lower()
            if (
                "@" not in line
                and not any(character.isdigit() for character in line)
                and 1 < len(line.split()) <= 4
                and not any(word in lowered for word in ("engineer", "developer", "manager", "analyst"))
            ):
                return line.strip()

        return people[0].strip() if people else ""

    def _extract_skills(self, text: str, sections: dict[str, str]) -> list[str]:
        section_skills = extract_skills(sections.get("skills", ""))
        document_skills = extract_skills(text)
        return dedupe(section_skills + document_skills)

    def _extract_education(
        self,
        text: str,
        sections: dict[str, str],
        entities: list[NerEntity],
    ) -> list[str]:
        section_text = sections.get("education", "")
        blocks = split_blocks(section_text)

        if not blocks:
            candidate_lines = [
                line
                for line in split_lines(text)
                if looks_like_education(line) or "university" in line.lower() or "college" in line.lower()
            ]
            blocks = [[line] for line in candidate_lines[:3]]

        entries: list[str] = []
        for block in blocks:
            joined = " ".join(block)
            date_range = parse_date_range(joined)
            institution = next(
                (
                    entity.text
                    for entity in entities
                    if entity.label == "ORG" and entity.text.lower() in joined.lower()
                ),
                "",
            )

            if not institution:
                institution = block[0] if block else ""

            detail = " ".join(line for line in block[1:] if line not in {institution, date_range}).strip()
            parts = [part for part in [institution, detail, date_range] if part]
            if parts:
                entries.append(" | ".join(parts))

        return dedupe(entries)

    def _extract_experience(
        self,
        text: str,
        sections: dict[str, str],
        entities: list[NerEntity],
    ) -> list[str]:
        section_text = sections.get("experience", "")
        blocks = split_blocks(section_text)

        if not blocks:
            blocks = self._guess_experience_blocks(text)

        entries: list[str] = []
        for block in blocks:
            heading = block[0] if block else ""
            joined = " ".join(block)
            date_range = parse_date_range(joined)
            organization = next(
                (
                    entity.text
                    for entity in entities
                    if entity.label == "ORG" and entity.text.lower() in joined.lower()
                ),
                "",
            )

            summary_lines = [
                line.lstrip("-• ").strip()
                for line in block[1:4]
                if line.strip() and line.strip() != date_range
            ]
            summary = " ".join(summary_lines).strip()

            entry = heading
            if organization and organization.lower() not in entry.lower():
                entry = f"{entry} at {organization}" if entry else organization
            if date_range:
                entry = f"{entry} ({date_range})".strip()
            if summary:
                entry = f"{entry} - {summary}".strip(" -")

            if entry:
                entries.append(entry)

        return dedupe(entries)

    @staticmethod
    def _guess_experience_blocks(text: str) -> list[list[str]]:
        lines = split_lines(text)
        blocks: list[list[str]] = []
        current: list[str] = []

        for line in lines:
            if parse_date_range(line) and current:
                current.append(line)
                blocks.append(current)
                current = []
                continue

            if current and line[:1].isupper() and len(line.split()) <= 8 and not line.endswith("."):
                blocks.append(current)
                current = [line]
            else:
                current.append(line)

        if current:
            blocks.append(current)

        return blocks[:4]
