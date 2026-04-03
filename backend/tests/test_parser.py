from __future__ import annotations

from app.config import Settings
from app.services.ner import NERService
from app.services.parser import ResumeParserService


def build_parser_service() -> ResumeParserService:
    settings = Settings(enable_transformers=False, enable_spacy=False)
    return ResumeParserService(
        settings=settings,
        ner_service=NERService(
            model_name=settings.model_name,
            max_chars=settings.model_max_chars,
            enable_transformers=False,
            enable_spacy=False,
        ),
    )


def test_parse_resume_from_plain_text_extracts_expected_fields():
    service = build_parser_service()
    content = b"""
Jordan Avery
jordan.avery@example.com
+1 555 234 8899

Skills
Python, FastAPI, React, Docker

Experience
Senior Engineer at BrightLayer
Jan 2021 - Present
Built internal tooling for recruiters.

Education
University of Illinois
B.S. Computer Science
2014 - 2018
"""

    result = service.parse_resume("resume.txt", "text/plain", content)

    assert result.name == "Jordan Avery"
    assert result.email == "jordan.avery@example.com"
    assert result.phone == "+1 555 234 8899"
    assert "Python" in result.skills
    assert any("University of Illinois" in entry for entry in result.education)
    assert any("BrightLayer" in entry for entry in result.experience)
