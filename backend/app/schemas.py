from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str = ""


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    client: str = ""
    description: str = ""


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    client: str | None = None
    description: str | None = None


class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    visits_count: int = 0
    reports_count: int = 0
    last_visit_date: date | None = None


class AssetRead(BaseModel):
    id: int
    kind: str
    filename: str
    url: str
    public_id: str | None = None
    mime_type: str | None = None
    extracted_text: str = ""
    transcript: str = ""
    created_at: datetime


class VisitRead(BaseModel):
    id: int
    project_id: int
    visit_date: date
    text_notes: str
    audio_transcription: str
    created_at: datetime
    assets: list[AssetRead] = []


class TemplateSection(BaseModel):
    title: str
    description: str = ""
    instructions: str = ""
    required: bool = True


class TemplateBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    client: str = ""
    description: str = ""
    sections: list[TemplateSection] = []
    ai_instructions: str = ""
    required_fields: list[str] = []


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    client: str | None = None
    description: str | None = None
    sections: list[TemplateSection] | None = None
    ai_instructions: str | None = None
    required_fields: list[str] | None = None


class TemplateRead(TemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None


class ReportGenerateRequest(BaseModel):
    template_id: int


class ReportRead(BaseModel):
    id: int
    project_id: int
    template_id: int
    title: str
    html_content: str
    source_payload: dict[str, Any] = {}
    created_at: datetime
    project_name: str | None = None
    template_name: str | None = None


class ReportPreview(BaseModel):
    title: str
    html_content: str
    source_payload: dict[str, Any]


class DashboardRead(BaseModel):
    projects: int
    visits: int
    reports: int
    templates: int
    recent_projects: list[ProjectRead]
