from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import UploadAsset, User, Visit
from app.schemas import VisitRead
from app.services.access import get_project_or_404, get_visit_or_404
from app.services.extractors import extract_pdf_text, transcribe_audio
from app.services.serializers import visit_to_read
from app.services.storage import storage_service

router = APIRouter(tags=["visits"])


@router.get("/projects/{project_id}/visits", response_model=list[VisitRead])
def list_project_visits(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_project_or_404(db, project_id, current_user)
    visits = db.scalars(select(Visit).where(Visit.project_id == project_id).order_by(Visit.visit_date.desc())).all()
    return [visit_to_read(visit) for visit in visits]


@router.post("/projects/{project_id}/visits", response_model=VisitRead, status_code=status.HTTP_201_CREATED)
async def create_visit(
    project_id: int,
    visit_date: Annotated[date, Form()],
    text_notes: Annotated[str, Form()] = "",
    pdfs: Annotated[list[UploadFile] | None, File()] = None,
    audios: Annotated[list[UploadFile] | None, File()] = None,
    photos: Annotated[list[UploadFile] | None, File()] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_project_or_404(db, project_id, current_user)
    if not photos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes adjuntar al menos una foto")

    visit = Visit(project_id=project_id, visit_date=visit_date, text_notes=text_notes.strip(), audio_transcription="")
    db.add(visit)
    db.flush()

    transcript_parts: list[str] = []

    async def store_asset(upload: UploadFile, kind: str) -> UploadAsset:
        data = await upload.read()
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"El archivo {upload.filename} está vacío")
        stored = storage_service.save_bytes(
            data,
            filename=upload.filename or f"{kind}.bin",
            folder=f"projects/{project_id}/visits/{visit.id}/{kind}",
            content_type=upload.content_type,
        )
        extracted_text = ""
        transcript = ""
        if kind == "pdf":
            extracted_text = extract_pdf_text(data)
        elif kind == "audio":
            transcript = transcribe_audio(data, upload.filename or "audio")
            if transcript:
                transcript_parts.append(transcript)
        asset = UploadAsset(
            visit_id=visit.id,
            kind=kind,
            filename=upload.filename or f"{kind}.bin",
            url=stored.url,
            public_id=stored.public_id,
            mime_type=upload.content_type,
            extracted_text=extracted_text,
            transcript=transcript,
        )
        db.add(asset)
        return asset

    for upload in pdfs or []:
        await store_asset(upload, "pdf")
    for upload in audios or []:
        await store_asset(upload, "audio")
    for upload in photos or []:
        await store_asset(upload, "photo")

    visit.audio_transcription = "\n".join(part for part in transcript_parts if part).strip()
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit_to_read(visit)


@router.get("/visits/{visit_id}", response_model=VisitRead)
def get_visit(visit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    visit = get_visit_or_404(db, visit_id, current_user)
    return visit_to_read(visit)


@router.delete("/visits/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(visit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    visit = get_visit_or_404(db, visit_id, current_user)
    db.delete(visit)
    db.commit()
    return None
