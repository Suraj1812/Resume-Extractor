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


def test_parse_resume_handles_dense_resume_layout_without_merging_sections():
    service = build_parser_service()
    content = b"""
Suraj Singh
SOFTWARE ENGINEER
SUMMARY
Software Engineer with 3+ years of experience building AI and scalable systems.
CONTACT
EMAIL
singhsuraj44500@gmail.com
PHONE
+91 96255 53534
LOCATION
Faridabad, Haryana EXPERIENCE
NEXUS SP SOLUTIONS \xc2\xb7 Freelance
Dec 2025 - Present
Architected and deployed full-stack ecommerce platforms.
Evtaar \xc2\xb7 Remote
Jan 2025 - Nov 2025
Developed high-performance frontend systems using React and Redux.
SKILLS
FRONTEND
Angular TypeScript Tailwind
BACKEND
Node.js NestJS Django FastAPI
CORE
PostgreSQL MongoDB MySQL
Docker Firebase Git
AI
LLM Integration OpenAI APIs
Prompt Engineering RAG Systems
Vector Databases LangChain
Embeddings AI Agents
EDUCATION
Aggarwal College, Ballabgarh
B.Voc in Software Development
CGPA: 8.8
2022 - 2025
Pal Public Sr. Sec. School
Commerce
81%
2021 - 2022
"""

    result = service.parse_resume("resume.txt", "text/plain", content)

    assert result.name == "Suraj Singh"
    assert result.email == "singhsuraj44500@gmail.com"
    assert result.phone == "+91 96255 53534"
    assert result.title == "Software Engineer"
    assert result.location == "Faridabad, Haryana"
    assert "Angular" in result.skills
    assert "NestJS" in result.skills
    assert "OpenAI APIs" in result.skills
    assert len(result.education) == 2
    assert result.education[0].institution == "Aggarwal College, Ballabgarh"
    assert result.education[0].degree == "B.Voc"
    assert result.education[0].field_of_study == "Software Development"
    assert result.education[0].grade == "CGPA: 8.8"
    assert result.education[1].institution == "Pal Public Sr. Sec. School"
    assert result.education[1].field_of_study == "Commerce"
    assert result.education[1].grade == "81%"
    assert len(result.experience) == 2
    assert result.experience[0].company == "NEXUS SP SOLUTIONS"
    assert result.experience[0].location == "Freelance"
    assert "ecommerce platforms" in result.experience[0].summary
    assert result.experience[1].company == "Evtaar"
    assert result.experience[1].location == "Remote"
