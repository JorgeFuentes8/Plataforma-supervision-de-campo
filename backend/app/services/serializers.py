from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Project, Report, ReportTemplate, UploadAsset, Visit


def asset_to_read(asset: UploadAsset) -> dict:
    return {
        "id": asset.id,
        "kind": asset.kind,
        "filename": asset.filename,
        "url": asset.url,
        "public_id": asset.public_id,
        "mime_type": asset.mime_type,
        "extracted_text": asset.extracted_text or "",
        "transcript": asset.transcript or "",
        "created_at": asset.created_at,
    }


def visit_to_read(visit: Visit) -> dict:
    return {
        "id": visit.id,
        "project_id": visit.project_id,
        "visit_date": visit.visit_date,
        "text_notes": visit.text_notes or "",
        "audio_transcription": visit.audio_transcription or "",
        "created_at": visit.created_at,
        "assets": [asset_to_read(asset) for asset in visit.assets],
    }


def project_to_read(db: Session, project: Project) -> dict:
    visits_count = db.scalar(select(func.count(Visit.id)).where(Visit.project_id == project.id)) or 0
    reports_count = db.scalar(select(func.count(Report.id)).where(Report.project_id == project.id)) or 0
    last_visit_date = db.scalar(select(func.max(Visit.visit_date)).where(Visit.project_id == project.id))
    return {
        "id": project.id,
        "name": project.name,
        "client": project.client,
        "description": project.description or "",
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "visits_count": visits_count,
        "reports_count": reports_count,
        "last_visit_date": last_visit_date,
    }


def template_to_read(template: ReportTemplate) -> dict:
    return {
        "id": template.id,
        "name": template.name,
        "client": template.client,
        "description": template.description or "",
        "sections": template.sections or [],
        "ai_instructions": template.ai_instructions or "",
        "required_fields": template.required_fields or [],
        "created_at": template.created_at,
        "updated_at": template.updated_at,
    }


def report_to_read(report: Report) -> dict:
    return {
        "id": report.id,
        "project_id": report.project_id,
        "template_id": report.template_id,
        "title": report.title,
        "html_content": report.html_content,
        "source_payload": report.source_payload or {},
        "created_at": report.created_at,
        "project_name": report.project.name if report.project else None,
        "template_name": report.template.name if report.template else None,
    }
