from sqlalchemy import JSON, Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False, default="")
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    templates = relationship("ReportTemplate", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    client = Column(String(255), nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="projects")
    visits = relationship("Visit", back_populates="project", cascade="all, delete-orphan", order_by="Visit.visit_date.desc()")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan", order_by="Report.created_at.desc()")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False)
    text_notes = Column(Text, nullable=False, default="")
    audio_transcription = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="visits")
    assets = relationship("UploadAsset", back_populates="visit", cascade="all, delete-orphan", order_by="UploadAsset.id")


class UploadAsset(Base):
    __tablename__ = "upload_assets"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)
    kind = Column(String(30), nullable=False)  # pdf, audio, photo
    filename = Column(String(512), nullable=False)
    url = Column(Text, nullable=False)
    public_id = Column(String(512), nullable=True)
    mime_type = Column(String(255), nullable=True)
    extracted_text = Column(Text, nullable=False, default="")
    transcript = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    visit = relationship("Visit", back_populates="assets")


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    client = Column(String(255), nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    sections = Column(JSON, nullable=False, default=list)
    ai_instructions = Column(Text, nullable=False, default="")
    required_fields = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    owner = relationship("User", back_populates="templates")
    reports = relationship("Report", back_populates="template")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    html_content = Column(Text, nullable=False)
    source_payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="reports")
    template = relationship("ReportTemplate", back_populates="reports")
