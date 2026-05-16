from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Project, Report, ReportTemplate, User, Visit


def get_project_or_404(db: Session, project_id: int, user: User) -> Project:
    project = db.scalar(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    return project


def get_template_or_404(db: Session, template_id: int, user: User) -> ReportTemplate:
    template = db.scalar(select(ReportTemplate).where(ReportTemplate.id == template_id, ReportTemplate.user_id == user.id))
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada")
    return template


def get_visit_or_404(db: Session, visit_id: int, user: User) -> Visit:
    visit = db.scalar(
        select(Visit).join(Project).where(Visit.id == visit_id, Project.user_id == user.id)
    )
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visita no encontrada")
    return visit


def get_report_or_404(db: Session, report_id: int, user: User) -> Report:
    report = db.scalar(
        select(Report).join(Project).where(Report.id == report_id, Project.user_id == user.id)
    )
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Informe no encontrado")
    return report
