from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Project, User
from app.schemas import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.access import get_project_or_404
from app.services.serializers import project_to_read

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.scalars(select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())).all()
    return [project_to_read(db, project) for project in projects]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(user_id=current_user.id, name=payload.name, client=payload.client, description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_read(db, project)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id, current_user)
    return project_to_read(db, project)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(project, field, value)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_read(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(db, project_id, current_user)
    db.delete(project)
    db.commit()
    return None
