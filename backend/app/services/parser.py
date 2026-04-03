from __future__ import annotations

import logging

import regex

from ..config import Settings
from ..models.schema import EducationEntry, ExperienceEntry, ResumeParseResponse
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

TITLE_KEYWORDS = (
    "engineer",
    "developer",
    "manager",
    "analyst",
    "scientist",
    "designer",
    "architect",
    "consultant",
    "intern",
    "lead",
    "specialist",
    "director",
    "administrator",
    "officer",
)
INSTITUTION_KEYWORDS = ("university", "college", "school", "institute", "academy")
FIELD_OF_STUDY_KEYWORDS = ("commerce", "science", "arts", "humanities")
NOISE_LABELS = {
    "summary",
    "contact",
    "email",
    "phone",
    "location",
    "linkedin",
    "portfolio",
    "skills",
    "frontend",
    "backend",
    "core",
    "ai",
    "education",
    "experience",
}
GRADE_LINE_PATTERN = regex.compile(
    r"^(?:cgpa|gpa|grade|percentage|score)\s*[:\-]?\s*[a-z0-9./% ]+$",
    regex.IGNORECASE,
)


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
        header_lines = split_lines(sections.get("header", text))[:18]
        document_lines = split_lines(text)[:40]
        name = self._extract_name(header_lines, entities)
        title = self._extract_title(header_lines, document_lines, name)
        location = self._extract_location(header_lines, document_lines, {name, title})

        return ResumeParseResponse(
            name=name,
            email=extract_email(text),
            phone=extract_phone(text),
            title=title,
            location=location,
            summary=self._extract_summary(sections, header_lines, document_lines, {name, title, location}),
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
                and not any(word in lowered for word in TITLE_KEYWORDS)
            ):
                return line.strip()

        return people[0].strip() if people else ""

    def _extract_title(self, header_lines: list[str], document_lines: list[str], name: str) -> str:
        fallback = ""

        for line in [*header_lines, *document_lines[:8]]:
            if line == name or self._is_contact_line(line):
                continue
            if self._looks_like_title(line):
                return self._normalize_title(line)
            if not fallback and 1 < len(line.split()) <= 8 and "," not in line:
                fallback = line.strip()

        return fallback

    def _extract_location(
        self,
        header_lines: list[str],
        document_lines: list[str],
        excluded_lines: set[str],
    ) -> str:
        labeled_location = self._extract_labeled_value([*header_lines, *document_lines], "location")
        if labeled_location:
            return labeled_location

        for line in [*header_lines, *document_lines[:10]]:
            lowered = line.lower()
            if line in excluded_lines or self._is_contact_line(line):
                continue
            if "," in line and not any(character.isdigit() for character in line):
                return line.strip()
            if lowered.endswith(
                ("india", "usa", "united states", "canada", "uk", "remote", "on-site", "onsite", "hybrid")
            ):
                return line.strip()
        return ""

    def _extract_summary(
        self,
        sections: dict[str, str],
        header_lines: list[str],
        document_lines: list[str],
        excluded_lines: set[str],
    ) -> str:
        summary_section = sections.get("summary", "")
        if summary_section:
            summary_lines: list[str] = []
            for line in split_lines(summary_section):
                if summary_lines and (
                    self._is_noise_label(line) or self._is_contact_value(line) or self._looks_like_location(line)
                ):
                    break
                if not self._is_noise_label(line) and not self._is_contact_value(line):
                    summary_lines.append(line)
            if summary_lines and self._looks_like_title(summary_lines[0]) and len(summary_lines[0].split()) <= 4:
                summary_lines = summary_lines[1:]
            return " ".join(summary_lines[:3]).strip()

        fallback_lines = [
            line
            for line in [*header_lines, *document_lines[:10]]
            if (
                line not in excluded_lines
                and not self._is_contact_line(line)
                and not self._is_noise_label(line)
                and len(line.split()) >= 6
            )
        ]
        return " ".join(fallback_lines[:2]).strip()

    def _extract_skills(self, text: str, sections: dict[str, str]) -> list[str]:
        section_skills = extract_skills(sections.get("skills", ""))
        document_skills = extract_skills(text)
        return dedupe(section_skills + document_skills)

    def _extract_education(
        self,
        text: str,
        sections: dict[str, str],
        entities: list[NerEntity],
    ) -> list[EducationEntry]:
        section_text = sections.get("education", "")
        blocks = self._split_education_blocks(section_text)

        if not blocks:
            blocks = self._guess_education_blocks(text)

        entries: list[EducationEntry] = []
        seen: set[tuple[str, str, str, str]] = set()

        for block in blocks:
            entry = self._parse_education_block(block, entities)
            key = (
                entry.institution.lower(),
                entry.degree.lower(),
                entry.start_date.lower(),
                entry.end_date.lower(),
            )

            if not any(entry.model_dump().values()) or key in seen:
                continue

            seen.add(key)
            entries.append(entry)

        return entries

    def _extract_experience(
        self,
        text: str,
        sections: dict[str, str],
        entities: list[NerEntity],
    ) -> list[ExperienceEntry]:
        section_text = sections.get("experience", "")
        blocks = self._split_experience_blocks(section_text)

        if not blocks and not section_text:
            blocks = self._guess_experience_blocks(text)

        entries: list[ExperienceEntry] = []
        seen: set[tuple[str, str, str, str]] = set()

        for block in blocks:
            entry = self._parse_experience_block(block, entities)
            key = (
                entry.company.lower(),
                entry.title.lower(),
                entry.start_date.lower(),
                entry.end_date.lower(),
            )

            if not any(entry.model_dump().values()) or key in seen:
                continue

            seen.add(key)
            entries.append(entry)

        return entries

    def _guess_education_blocks(self, text: str) -> list[list[str]]:
        return self._split_education_blocks(text)[:4]

    def _guess_experience_blocks(self, text: str) -> list[list[str]]:
        return self._split_experience_blocks(text)[:6]

    def _split_education_blocks(self, text: str) -> list[list[str]]:
        lines = [
            line
            for line in split_lines(text)
            if not self._is_noise_label(line) and not self._is_contact_value(line)
        ]
        if not lines:
            return []

        blocks: list[list[str]] = []
        current: list[str] = []

        for line in lines:
            starts_new = any(keyword in line.lower() for keyword in INSTITUTION_KEYWORDS)
            if current and starts_new:
                blocks.append(current)
                current = [line]
                continue
            current.append(line)

        if current:
            blocks.append(current)

        return [
            block
            for block in blocks
            if any(
                looks_like_education(line)
                or any(keyword in line.lower() for keyword in INSTITUTION_KEYWORDS)
                or self._is_grade_line(line)
                for line in block
            )
        ]

    def _split_experience_blocks(self, text: str) -> list[list[str]]:
        lines = split_lines(text)
        if not lines:
            return []

        blocks: list[list[str]] = []
        current: list[str] = []

        for index, raw_line in enumerate(lines):
            line = raw_line.strip()
            if not line or self._is_noise_label(line) or self._is_contact_value(line):
                continue

            next_line = ""
            for candidate in lines[index + 1 :]:
                candidate = candidate.strip()
                if candidate and not self._is_noise_label(candidate):
                    next_line = candidate
                    break

            if self._is_experience_entry_start(line, next_line):
                if current:
                    blocks.append(current)
                current = [line]
                continue

            if current:
                current.append(line)

        if current:
            blocks.append(current)

        return [
            block
            for block in blocks
            if parse_date_range(" ".join(block))
            and not any(any(keyword in line.lower() for keyword in INSTITUTION_KEYWORDS) for line in block[:2])
        ]

    def _parse_education_block(self, block: list[str], entities: list[NerEntity]) -> EducationEntry:
        joined = " ".join(block)
        date_range = self._find_date_range(block) or parse_date_range(joined)
        start_date, end_date = self._split_date_range(date_range)

        institution = next(
            (line for line in block if any(keyword in line.lower() for keyword in INSTITUTION_KEYWORDS)),
            "",
        )
        if not institution:
            institution = next(
                (
                    entity.text
                    for entity in entities
                    if entity.label == "ORG" and entity.text.lower() in joined.lower()
                ),
                "",
            )
        if not institution and block:
            institution = block[0]

        degree_line = next((line for line in block if looks_like_education(line)), "")
        if not degree_line:
            degree_line = next(
                (
                    line
                    for line in block
                    if (
                        line != institution
                        and not self._is_date_only_line(line)
                        and not self._is_grade_line(line)
                        and not self._is_contact_value(line)
                    )
                ),
                "",
            )

        degree, field_of_study = self._split_degree_line(degree_line)
        grade = self._extract_grade(block)
        location = next(
            (
                line
                for line in block
                if line not in {institution, degree_line, date_range, grade}
                and self._looks_like_location(line)
            ),
            "",
        )

        used_lines = {institution, degree_line, date_range, grade, location}
        details = dedupe(
            [
                line
                for line in block
                if line not in used_lines and not self._is_date_only_line(line)
            ]
        )

        return EducationEntry(
            institution=institution,
            degree=degree,
            field_of_study=field_of_study,
            start_date=start_date,
            end_date=end_date,
            grade=grade,
            location=location,
            details=details,
        )

    def _parse_experience_block(self, block: list[str], entities: list[NerEntity]) -> ExperienceEntry:
        joined = " ".join(block)
        date_range = self._find_date_range(block) or parse_date_range(joined)
        start_date, end_date = self._split_date_range(date_range)
        lines = [line for line in block if line.strip() and line.strip() != date_range]
        lines = [
            line
            for line in lines
            if not self._is_noise_label(line) and not self._is_contact_value(line)
        ]

        if not lines:
            return ExperienceEntry(start_date=start_date, end_date=end_date)

        company = ""
        title = ""
        used_heading_line = ""
        heading_location = ""

        first_line = lines[0]
        if "·" in first_line:
            segments = [segment.strip() for segment in first_line.split("·") if segment.strip()]
            company = segments[0] if segments else first_line.strip()
            heading_location = segments[1] if len(segments) > 1 else ""
            used_heading_line = first_line
        elif " at " in first_line.lower():
            parts = regex.split(r"\bat\b", first_line, maxsplit=1, flags=regex.IGNORECASE)
            if len(parts) == 2:
                title = parts[0].strip(" ,-")
                company = parts[1].strip(" ,-")
                used_heading_line = first_line
        elif self._looks_like_title(first_line):
            title = first_line
        else:
            company = first_line

        if len(lines) > 1:
            second_line = lines[1]
            if not title and self._looks_like_title(second_line):
                title = second_line
            elif not company and not self._looks_like_location(second_line):
                company = second_line

        organization = next(
            (
                entity.text
                for entity in entities
                if entity.label == "ORG" and entity.text.lower() in joined.lower()
            ),
            "",
        )
        if organization and not company:
            company = organization

        location = heading_location or next(
            (
                line
                for line in lines
                if line not in {title, company}
                and self._looks_like_location(line)
            ),
            "",
        )

        remaining = [
            line.lstrip("-• ").strip()
            for line in lines
            if line not in {title, company, location, used_heading_line}
            and line.strip()
            and not self._is_date_only_line(line)
        ]

        summary = remaining[0] if remaining else ""
        highlights = dedupe(remaining[1:] if len(remaining) > 1 else [])

        if not company and organization:
            company = organization

        return ExperienceEntry(
            company=company,
            title=title,
            start_date=start_date,
            end_date=end_date,
            location=location,
            summary=summary,
            highlights=highlights,
        )

    @staticmethod
    def _split_date_range(date_range: str) -> tuple[str, str]:
        if not date_range:
            return "", ""
        start_date, _, end_date = date_range.partition(" - ")
        return start_date.strip(), end_date.strip()

    @staticmethod
    def _split_degree_line(line: str) -> tuple[str, str]:
        if not line:
            return "", ""

        cleaned = line.strip()
        parts = regex.split(r"\bin\b", cleaned, maxsplit=1, flags=regex.IGNORECASE)
        if len(parts) == 2:
            return parts[0].strip(" ,-|"), parts[1].strip(" ,-|")

        if "|" in cleaned:
            segments = [segment.strip() for segment in cleaned.split("|") if segment.strip()]
            if len(segments) >= 2:
                return segments[0], segments[1]

        if (
            len(cleaned.split()) <= 4
            and not looks_like_education(cleaned)
            and any(keyword in cleaned.lower() for keyword in FIELD_OF_STUDY_KEYWORDS)
        ):
            return "", cleaned

        return cleaned, ""

    @staticmethod
    def _extract_grade(lines: list[str]) -> str:
        for line in lines:
            cleaned = line.strip()
            if GRADE_LINE_PATTERN.fullmatch(cleaned):
                return cleaned
            if regex.fullmatch(r"\d{1,3}(?:\.\d+)?%", cleaned):
                return cleaned
        return ""

    @staticmethod
    def _is_contact_line(line: str) -> bool:
        lowered = line.lower()
        digit_count = sum(character.isdigit() for character in line)
        return (
            "@" in line
            or "linkedin.com" in lowered
            or "github.com" in lowered
            or lowered.startswith("in/")
            or (digit_count >= 10 and bool(regex.search(r"\+?\d[\d\s().-]{7,}", line)))
        )

    @staticmethod
    def _is_date_only_line(line: str) -> bool:
        return bool(parse_date_range(line)) or bool(regex.fullmatch(r"\d{4}\s*[-–]\s*\d{4}", line))

    @staticmethod
    def _looks_like_location(line: str) -> bool:
        if "@" in line or any(character.isdigit() for character in line):
            return False
        return "," in line or line.lower().endswith(
            ("india", "usa", "remote", "uk", "canada", "freelance", "hybrid", "on-site", "onsite")
        )

    @staticmethod
    def _looks_like_title(line: str) -> bool:
        lowered = line.lower()
        return (
            len(line.split()) <= 8
            and not line.endswith(".")
            and any(regex.search(rf"\b{regex.escape(keyword)}\b", lowered) for keyword in TITLE_KEYWORDS)
        )

    def _extract_labeled_value(self, lines: list[str], label: str) -> str:
        normalized_label = label.lower()
        for index, line in enumerate(lines):
            lowered = line.lower().strip()
            if lowered == normalized_label and index + 1 < len(lines):
                value = self._strip_trailing_section_heading(lines[index + 1].strip())
                if value and not self._is_noise_label(value):
                    return value

            match = regex.match(
                rf"^{regex.escape(label)}\s*[:\-]?\s*(.+)$",
                line,
                regex.IGNORECASE,
            )
            if match:
                value = self._strip_trailing_section_heading(match.group(1).strip())
                if value and not self._is_noise_label(value):
                    return value

        return ""

    def _is_experience_entry_start(self, line: str, next_line: str) -> bool:
        lowered = line.lower()
        if self._is_noise_label(line) or self._is_contact_value(line):
            return False
        if "·" in line:
            return True
        if " at " in lowered and next_line and parse_date_range(next_line):
            return True
        if next_line and parse_date_range(next_line):
            return len(line.split()) <= 8 and not self._looks_like_location(line)
        return False

    @staticmethod
    def _normalize_title(line: str) -> str:
        cleaned = regex.sub(r"\s+", " ", line).strip()
        if cleaned.isupper():
            return cleaned.title()
        return cleaned

    @staticmethod
    def _is_noise_label(line: str) -> bool:
        return line.strip().lower().rstrip(":") in NOISE_LABELS

    def _is_contact_value(self, line: str) -> bool:
        lowered = line.lower().strip()
        return (
            self._is_contact_line(line)
            or lowered.startswith("in/")
            or lowered.startswith("http")
            or "portfolio" in lowered
        )

    @staticmethod
    def _is_grade_line(line: str) -> bool:
        cleaned = line.strip()
        return bool(GRADE_LINE_PATTERN.fullmatch(cleaned) or regex.fullmatch(r"\d{1,3}(?:\.\d+)?%", cleaned))

    @staticmethod
    def _strip_trailing_section_heading(value: str) -> str:
        return regex.sub(r"\s+(summary|skills|experience|education)\s*$", "", value, flags=regex.IGNORECASE).strip()

    @staticmethod
    def _find_date_range(lines: list[str]) -> str:
        for line in lines:
            parsed = parse_date_range(line)
            if parsed:
                return parsed

            year_range = regex.fullmatch(r"(?P<start>\d{4})\s*[-–]\s*(?P<end>\d{4}|Present|Current)", line, regex.IGNORECASE)
            if year_range:
                return f"{year_range.group('start')} - {year_range.group('end')}"

        return ""
