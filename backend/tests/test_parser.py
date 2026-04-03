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
Senior Software Engineer
jordan.avery@example.com
+1 555 234 8899

Summary
Backend-focused engineer with 6+ years of experience building hiring systems.

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
    assert result.title == "Senior Software Engineer"
    assert "Backend-focused engineer" in result.summary
    assert "Python" in result.skills
    assert result.education[0].institution == "University of Illinois"
    assert result.education[0].degree == "B.S. Computer Science"
    assert result.education[0].start_date == "2014"
    assert result.education[0].end_date == "2018"
    assert result.experience[0].company == "BrightLayer"
    assert result.experience[0].title == "Senior Engineer"
    assert result.experience[0].start_date == "Jan 2021"
    assert result.experience[0].end_date == "Present"
    assert "Built internal tooling" in result.experience[0].summary
