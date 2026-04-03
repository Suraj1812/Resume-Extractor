from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ResumeParseResponse(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
