from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Project, Report, User, Visit
from app.schemas import ReportGenerateRequest, ReportPreview, ReportRead
from app.services.access import get_project_or_404, get_report_or_404, get_template_or_404
from app.services.ai import generate_report_html
from app.services.pdf import html_to_pdf_bytes
from app.services.serializers import report_to_read

router = APIRouter(tags=["reports"])


def _visits_for_project(db: Session, project_id: int) -> list[Visit]:
    return db.scalars(select(Visit).where(Visit.project_id == project_id).order_by(Visit.visit_date.desc())).unique().all()


@router.get("/reports", response_model=list[ReportRead])
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.scalars(
        select(Report).join(Project).where(Project.user_id == current_user.id).order_by(Report.created_at.desc())
    ).all()
    return [report_to_read(report) for report in reports]


@router.get("/projects/{project_id}/reports", response_model=list[ReportRead])
def list_project_reports(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_project_or_404(db, project_id, current_user)
    reports = db.scalars(select(Report).where(Report.project_id == project_id).order_by(Report.created_at.desc())).all()
    return [report_to_read(report) for report in reports]


@router.post("/projects/{project_id}/reports/preview", response_model=ReportPreview)
def preview_report(project_id: int, payload: ReportGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id, current_user)
    template = get_template_or_404(db, payload.template_id, current_user)
    visits = _visits_for_project(db, project.id)
    html_content, source_payload = generate_report_html(db, project, visits, template)
    return {"title": f"Informe - {project.name}", "html_content": html_content, "source_payload": source_payload}


@router.post("/projects/{project_id}/reports", response_model=ReportRead)
def create_report(project_id: int, payload: ReportGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id, current_user)
    template = get_template_or_404(db, payload.template_id, current_user)
    visits = _visits_for_project(db, project.id)
    html_content, source_payload = generate_report_html(db, project, visits, template)
    report = Report(
        project_id=project.id,
        template_id=template.id,
        title=f"Informe - {project.name}",
        html_content=html_content,
        source_payload=source_payload,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report_to_read(report)


@router.get("/reports/{report_id}", response_model=ReportRead)
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = get_report_or_404(db, report_id, current_user)
    return report_to_read(report)


@router.get("/reports/{report_id}/export/html")
def export_report_html(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = get_report_or_404(db, report_id, current_user)
    full_html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>{report.title}</title>
<style>
body {{ font-family: Inter, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.55; }}
h1 {{ color: #0f3b2e; }}
h2 {{ margin-top: 30px; color: #14532d; border-bottom: 1px solid #d1fae5; padding-bottom: 6px; }}
table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
th, td {{ border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }}
th {{ background: #ecfdf5; text-align: left; }}
img {{ max-width: 100%; border-radius: 12px; }}
figure {{ margin: 18px 0; }}
figcaption {{ color: #64748b; font-size: 13px; }}
.photo-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }}
blockquote {{ background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; }}
</style>
</head>
<body>{report.html_content}</body>
</html>"""
    filename = f"informe_{report.id}.html"
    return Response(
        content=full_html,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/reports/{report_id}/export/pdf")
def export_report_pdf(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = get_report_or_404(db, report_id, current_user)
    pdf_bytes = html_to_pdf_bytes(report.html_content, report.title)
    filename = f"informe_{report.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
