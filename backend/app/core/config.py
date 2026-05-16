from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "AGFOREST Supervisión de Campo"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = "postgresql+psycopg://agforest:agforest@localhost:5432/agforest"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: str = "http://localhost:3000"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4.1-mini"
    OPENAI_TRANSCRIPTION_MODEL: str = "whisper-1"

    STORAGE_BACKEND: str = "local"  # local, cloudinary, auto
    BACKEND_PUBLIC_URL: str = "http://localhost:8000"
    LOCAL_UPLOAD_DIR: str = "uploads"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "agforest"

    AUTO_CREATE_TABLES: bool = True
    SEED_DEMO_DATA: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def local_upload_path(self) -> Path:
        return Path(self.LOCAL_UPLOAD_DIR).resolve()

    @property
    def cloudinary_enabled(self) -> bool:
        return all([self.CLOUDINARY_CLOUD_NAME, self.CLOUDINARY_API_KEY, self.CLOUDINARY_API_SECRET])


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
