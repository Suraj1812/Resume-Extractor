from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class EducationEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    start_date: str = ""
    end_date: str = ""
    grade: str = ""
    location: str = ""
    details: list[str] = Field(default_factory=list)


class ExperienceEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    company: str = ""
    title: str = ""
    start_date: str = ""
    end_date: str = ""
    location: str = ""
    summary: str = ""
    highlights: list[str] = Field(default_factory=list)


class ResumeParseResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = ""
    email: str = ""
    phone: str = ""
    title: str = ""
    location: str = ""
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
