import io
import re
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import cloudinary
import cloudinary.uploader

from app.core.config import settings


@dataclass
class StoredFile:
    url: str
    public_id: str


def safe_filename(filename: str) -> str:
    name = filename.strip().replace(" ", "_") or "archivo"
    return re.sub(r"[^A-Za-z0-9_.-]", "_", name)


class StorageService:
    def __init__(self) -> None:
        settings.local_upload_path.mkdir(parents=True, exist_ok=True)
        if settings.cloudinary_enabled:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

    def _use_cloudinary(self) -> bool:
        if settings.STORAGE_BACKEND == "cloudinary":
            return settings.cloudinary_enabled
        if settings.STORAGE_BACKEND == "auto":
            return settings.cloudinary_enabled
        return False

    def save_bytes(self, data: bytes, filename: str, folder: str, content_type: str | None = None) -> StoredFile:
        normalized_name = f"{uuid4().hex}_{safe_filename(filename)}"
        clean_folder = folder.strip("/")

        if self._use_cloudinary():
            buffer = io.BytesIO(data)
            buffer.name = normalized_name
            cloud_folder = f"{settings.CLOUDINARY_FOLDER}/{clean_folder}".strip("/")
            result = cloudinary.uploader.upload(
                buffer,
                folder=cloud_folder,
                resource_type="auto",
                use_filename=True,
                unique_filename=True,
                overwrite=False,
            )
            return StoredFile(url=result["secure_url"], public_id=result.get("public_id", ""))

        destination_dir = settings.local_upload_path / clean_folder
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / normalized_name
        destination.write_bytes(data)
        rel_path = destination.relative_to(settings.local_upload_path).as_posix()
        public_url = f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/uploads/{rel_path}"
        return StoredFile(url=public_url, public_id=f"local:{rel_path}")


storage_service = StorageService()
