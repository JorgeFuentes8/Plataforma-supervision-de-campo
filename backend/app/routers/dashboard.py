from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Project, Report, ReportTemplate, User, Visit
from app.schemas import DashboardRead
from app.services.serializers import project_to_read

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardRead)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_ids = select(Project.id).where(Project.user_id == current_user.id)
    project_count = db.scalar(select(func.count(Project.id)).where(Project.user_id == current_user.id)) or 0
    visit_count = db.scalar(select(func.count(Visit.id)).where(Visit.project_id.in_(project_ids))) or 0
    report_count = db.scalar(select(func.count(Report.id)).where(Report.project_id.in_(project_ids))) or 0
    template_count = db.scalar(select(func.count(ReportTemplate.id)).where(ReportTemplate.user_id == current_user.id)) or 0
    recent_projects = db.scalars(
        select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc()).limit(5)
    ).all()
    return {
        "projects": project_count,
        "visits": visit_count,
        "reports": report_count,
        "templates": template_count,
        "recent_projects": [project_to_read(db, project) for project in recent_projects],
    }
