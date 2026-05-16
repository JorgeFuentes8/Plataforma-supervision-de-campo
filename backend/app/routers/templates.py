from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import ReportTemplate, User
from app.schemas import TemplateCreate, TemplateRead, TemplateUpdate
from app.services.access import get_template_or_404
from app.services.serializers import template_to_read

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateRead])
def list_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    templates = db.scalars(
        select(ReportTemplate).where(ReportTemplate.user_id == current_user.id).order_by(ReportTemplate.created_at.desc())
    ).all()
    return [template_to_read(template) for template in templates]


@router.post("", response_model=TemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = ReportTemplate(
        user_id=current_user.id,
        name=payload.name,
        client=payload.client,
        description=payload.description,
        sections=[section.model_dump() for section in payload.sections],
        ai_instructions=payload.ai_instructions,
        required_fields=payload.required_fields,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template_to_read(template)


@router.get("/{template_id}", response_model=TemplateRead)
def get_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = get_template_or_404(db, template_id, current_user)
    return template_to_read(template)


@router.put("/{template_id}", response_model=TemplateRead)
def update_template(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = get_template_or_404(db, template_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    if "sections" in data and data["sections"] is not None:
        data["sections"] = [section.model_dump() if hasattr(section, "model_dump") else section for section in data["sections"]]
    for field, value in data.items():
        setattr(template, field, value)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template_to_read(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = get_template_or_404(db, template_id, current_user)
    db.delete(template)
    db.commit()
    return None
