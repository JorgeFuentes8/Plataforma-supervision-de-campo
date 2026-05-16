import tempfile
from io import BytesIO
from pathlib import Path

from openai import OpenAI
from pypdf import PdfReader

from app.core.config import settings


def extract_pdf_text(data: bytes, max_chars: int = 16000) -> str:
    if not data:
        return ""
    try:
        reader = PdfReader(BytesIO(data))
        chunks: list[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                chunks.append(text.strip())
        return "\n\n".join(chunks)[:max_chars]
    except Exception as exc:
        return f"No se pudo extraer texto del PDF: {exc}"


def transcribe_audio(data: bytes, filename: str) -> str:
    if not settings.OPENAI_API_KEY:
        return ""

    suffix = Path(filename).suffix or ".mp3"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = Path(tmp.name)

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        with tmp_path.open("rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model=settings.OPENAI_TRANSCRIPTION_MODEL,
                file=audio_file,
                response_format="text",
            )
        return transcript if isinstance(transcript, str) else getattr(transcript, "text", "")
    except Exception as exc:
        return f"No se pudo transcribir el audio automáticamente: {exc}"
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
