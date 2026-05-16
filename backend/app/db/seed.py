from datetime import date
from math import sin, pi
import wave

from PIL import Image, ImageDraw
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models import Project, ReportTemplate, UploadAsset, User, Visit


def _public_url(rel_path: str) -> str:
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/uploads/{rel_path}"


def _ensure_demo_files() -> dict[str, str]:
    demo_dir = settings.local_upload_path / "demo"
    demo_dir.mkdir(parents=True, exist_ok=True)

    trunk_path = demo_dir / "tronco_arbol.jpg"
    if not trunk_path.exists():
        image = Image.new("RGB", (900, 620), (235, 224, 205))
        draw = ImageDraw.Draw(image)
        for x in range(0, 900, 32):
            draw.rectangle([x, 0, x + 18, 620], fill=(92 + (x % 70), 67, 45))
        for y in range(70, 560, 90):
            draw.ellipse([360, y, 460, y + 45], outline=(40, 30, 22), width=4)
            draw.ellipse([510, y + 25, 570, y + 55], outline=(55, 35, 25), width=3)
        image.save(trunk_path, quality=90)

    park_path = demo_dir / "parque_urbano.jpg"
    if not park_path.exists():
        image = Image.new("RGB", (900, 620), (206, 232, 250))
        draw = ImageDraw.Draw(image)
        draw.rectangle([0, 390, 900, 620], fill=(126, 174, 99))
        draw.rectangle([0, 515, 900, 620], fill=(118, 112, 96))
        for cx in [150, 320, 520, 720]:
            draw.rectangle([cx - 15, 240, cx + 15, 430], fill=(92, 62, 38))
            draw.ellipse([cx - 95, 120, cx + 95, 300], fill=(62, 137, 78))
            draw.ellipse([cx - 65, 90, cx + 115, 245], fill=(76, 153, 86))
        image.save(park_path, quality=90)

    pdf_path = demo_dir / "informe_ayuntamiento_2023.pdf"
    if not pdf_path.exists():
        pdf = canvas.Canvas(str(pdf_path), pagesize=A4)
        pdf.setTitle("Informe municipal arbolado 2023")
        pdf.setFont("Helvetica-Bold", 15)
        pdf.drawString(72, 780, "Informe municipal de arbolado 2023")
        pdf.setFont("Helvetica", 11)
        lines = [
            "Zona centro: se detectaron incidencias recurrentes en alcornoques.",
            "Se recomienda seguimiento fitosanitario anual y revisión de perforaciones.",
            "No se observaron daños estructurales graves en la inspección anterior.",
        ]
        y = 735
        for line in lines:
            pdf.drawString(72, y, line)
            y -= 22
        pdf.save()

    audio_path = demo_dir / "audio_visita_25_05.wav"
    if not audio_path.exists():
        framerate = 16000
        duration_seconds = 1
        amplitude = 1200
        with wave.open(str(audio_path), "w") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(framerate)
            frames = bytearray()
            for i in range(framerate * duration_seconds):
                sample = int(amplitude * sin(2 * pi * 440 * i / framerate))
                frames.extend(sample.to_bytes(2, byteorder="little", signed=True))
            wav.writeframes(bytes(frames))

    return {
        "trunk": "demo/tronco_arbol.jpg",
        "park": "demo/parque_urbano.jpg",
        "pdf": "demo/informe_ayuntamiento_2023.pdf",
        "audio": "demo/audio_visita_25_05.wav",
    }


def _template_sections_simple() -> list[dict]:
    return [
        {"title": "Portada", "description": "Datos básicos del proyecto", "instructions": "Presenta el proyecto de forma clara", "required": True},
        {"title": "Árboles inspeccionados", "description": "Resumen de ejemplares revisados", "instructions": "Lenguaje accesible", "required": True},
        {"title": "Patologías detectadas", "description": "Observaciones de campo", "instructions": "Explica las incidencias sin tecnicismos excesivos", "required": True},
        {"title": "Recomendaciones de actuación", "description": "Pasos recomendados", "instructions": "Acciones directas y comprensibles", "required": True},
        {"title": "Anexos", "description": "Fotos y documentos", "instructions": "Incluye enlaces a documentos y fotos", "required": False},
    ]


def _template_sections_technical() -> list[dict]:
    return [
        {"title": "Portada", "description": "Identificación del expediente", "instructions": "Incluye código de expediente si consta", "required": True},
        {"title": "Datos generales", "description": "Datos del cliente, visita y equipo", "instructions": "Tono formal", "required": True},
        {"title": "Objetivo de la visita", "description": "Alcance de la supervisión", "instructions": "Precisión técnica", "required": True},
        {"title": "Metodología", "description": "Método de inspección visual", "instructions": "Lenguaje técnico", "required": True},
        {"title": "Árboles inspeccionados", "description": "Ejemplares revisados", "instructions": "Incluye evidencias fotográficas", "required": True},
        {"title": "Patologías detectadas", "description": "Indicios fitosanitarios", "instructions": "Usa terminología fitosanitaria", "required": True},
        {"title": "Clasificación de riesgo", "description": "Bajo, medio o alto", "instructions": "Clasifica de forma justificada", "required": True},
        {"title": "Tabla de actuaciones urgentes", "description": "Tabla resumen", "instructions": "Prioriza actuaciones", "required": True},
        {"title": "Recomendaciones técnicas", "description": "Medidas propuestas", "instructions": "Formal y accionable", "required": True},
        {"title": "Anexos", "description": "Documentación", "instructions": "Documentos y fotografías", "required": False},
    ]


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(User).where(User.email == "demo@agforest.local")):
        return

    files = _ensure_demo_files()
    user = User(
        email="demo@agforest.local",
        full_name="Técnico Forestal Demo",
        hashed_password=get_password_hash("demo1234"),
    )
    db.add(user)
    db.flush()

    simple_template = ReportTemplate(
        user_id=user.id,
        name="Informe sencillo – Ayto.",
        client="Ayuntamiento de San Pedro",
        description="Formato simple y directo para personal no técnico.",
        sections=_template_sections_simple(),
        ai_instructions="Redacta en lenguaje claro, accesible y directo. Evita tecnicismos no explicados. Prioriza árboles inspeccionados, patologías detectadas y recomendaciones de actuación.",
        required_fields=["Datos generales", "Árboles inspeccionados", "Patologías detectadas", "Recomendaciones"],
    )
    technical_template = ReportTemplate(
        user_id=user.id,
        name="Informe técnico – Consejería",
        client="Consejería de Medio Ambiente",
        description="Formato técnico formal con clasificación de riesgos.",
        sections=_template_sections_technical(),
        ai_instructions="Eres un asistente técnico especializado en sanidad vegetal y arbolado urbano. Redacta el informe con lenguaje técnico y formal. Utiliza terminología fitosanitaria específica. Clasifica las patologías por nivel de riesgo (Alto, Medio, Bajo). Incluye tablas cuando sea necesario. Los campos marcados como obligatorios deben estar siempre presentes.",
        required_fields=["Datos generales", "Árboles inspeccionados", "Patologías detectadas", "Clasificación de riesgo", "Recomendaciones técnicas"],
    )
    parks_template = ReportTemplate(
        user_id=user.id,
        name="Informe parques urbanos",
        client="Empresa de Parques",
        description="Informe para mantenimiento de parques.",
        sections=_template_sections_simple(),
        ai_instructions="Enfatiza mantenimiento preventivo y planificación de actuaciones.",
        required_fields=["Árboles inspeccionados", "Recomendaciones"],
    )
    db.add_all([simple_template, technical_template, parks_template])

    projects = [
        Project(user_id=user.id, name="Arbolado Urbano – Centro", client="Ayuntamiento de San Pedro", description="Supervisión del estado del arbolado urbano en el centro del municipio."),
        Project(user_id=user.id, name="Parque del Río", client="Ayuntamiento de San Pedro", description="Seguimiento del arbolado de ribera y zonas estanciales."),
        Project(user_id=user.id, name="Zona Verde Norte", client="Consejería de Medio Ambiente", description="Inspección fitosanitaria de zona verde periurbana."),
        Project(user_id=user.id, name="Monte de Utilidad Pública #45", client="Consejería de Medio Ambiente", description="Control de incidencias en masa forestal próxima a núcleo urbano."),
        Project(user_id=user.id, name="Arbolado Urbano – Barrio del Sur", client="Ayuntamiento de San Pedro", description="Revisión de alineaciones de arbolado urbano."),
    ]
    db.add_all(projects)
    db.flush()

    visit = Visit(
        project_id=projects[0].id,
        visit_date=date(2024, 5, 25),
        text_notes="Alcornoque con señales de perforación en tronco, posible presencia de perforador. El operario del ayuntamiento indicó que ya se detectó el mismo problema el año pasado en la misma zona.",
        audio_transcription="El operario del ayuntamiento indicó que ya se detectó el mismo problema el año pasado en la misma zona.",
    )
    db.add(visit)
    db.flush()
    db.add_all(
        [
            UploadAsset(
                visit_id=visit.id,
                kind="pdf",
                filename="informe_ayuntamiento_2023.pdf",
                url=_public_url(files["pdf"]),
                public_id=f"local:{files['pdf']}",
                mime_type="application/pdf",
                extracted_text="Informe municipal 2023: zona centro con incidencias recurrentes en alcornoques. Se recomendó seguimiento fitosanitario anual y revisión de perforaciones.",
            ),
            UploadAsset(
                visit_id=visit.id,
                kind="audio",
                filename="audio_visita_25_05.wav",
                url=_public_url(files["audio"]),
                public_id=f"local:{files['audio']}",
                mime_type="audio/wav",
                transcript="El operario del ayuntamiento indicó que ya se detectó el mismo problema el año pasado en la misma zona.",
            ),
            UploadAsset(
                visit_id=visit.id,
                kind="photo",
                filename="tronco_arbol.jpg",
                url=_public_url(files["trunk"]),
                public_id=f"local:{files['trunk']}",
                mime_type="image/jpeg",
            ),
            UploadAsset(
                visit_id=visit.id,
                kind="photo",
                filename="parque_urbano.jpg",
                url=_public_url(files["park"]),
                public_id=f"local:{files['park']}",
                mime_type="image/jpeg",
            ),
        ]
    )

    for project, day in zip(projects[1:], [22, 20, 18, 15], strict=False):
        db.add(
            Visit(
                project_id=project.id,
                visit_date=date(2024, 5, day),
                text_notes="Visita de seguimiento sin incidencias urgentes. Se recomienda mantener observación periódica.",
                audio_transcription="",
            )
        )
    db.commit()
