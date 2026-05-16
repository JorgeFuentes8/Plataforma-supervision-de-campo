import html
import json
from datetime import date, datetime
from typing import Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Project, ReportTemplate, Visit


def _json_default(value: Any) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return str(value)


def build_report_payload(project: Project, visits: list[Visit], template: ReportTemplate) -> dict[str, Any]:
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "client": project.client,
            "description": project.description,
        },
        "template": {
            "id": template.id,
            "name": template.name,
            "client": template.client,
            "description": template.description,
            "sections": template.sections or [],
            "ai_instructions": template.ai_instructions,
            "required_fields": template.required_fields or [],
        },
        "visits": [
            {
                "id": visit.id,
                "visit_date": visit.visit_date.isoformat(),
                "text_notes": visit.text_notes,
                "audio_transcription": visit.audio_transcription,
                "documents": [
                    {
                        "filename": asset.filename,
                        "url": asset.url,
                        "extracted_text": asset.extracted_text,
                    }
                    for asset in visit.assets
                    if asset.kind == "pdf"
                ],
                "audios": [
                    {
                        "filename": asset.filename,
                        "url": asset.url,
                        "transcript": asset.transcript,
                    }
                    for asset in visit.assets
                    if asset.kind == "audio"
                ],
                "photos": [
                    {
                        "filename": asset.filename,
                        "url": asset.url,
                    }
                    for asset in visit.assets
                    if asset.kind == "photo"
                ],
            }
            for visit in visits
        ],
    }


def generate_report_html(db: Session, project: Project, visits: list[Visit], template: ReportTemplate) -> tuple[str, dict[str, Any]]:
    payload = build_report_payload(project, visits, template)
    if settings.OPENAI_API_KEY:
        try:
            return _generate_with_openai(payload), payload
        except Exception as exc:
            fallback = _generate_fallback_html(payload)
            fallback += f"\n<!-- Generación IA no disponible, se usó generador local: {html.escape(str(exc))} -->"
            return fallback, payload
    return _generate_fallback_html(payload), payload


def _generate_with_openai(payload: dict[str, Any]) -> str:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    system_instructions = """
Eres un redactor técnico especializado en informes de supervisión de campo forestal y arbolado urbano.
La plantilla recibida es obligatoria: respeta el orden de secciones, instrucciones, tono y campos obligatorios.
Usa únicamente los datos aportados en proyecto, visitas, documentos extraídos, notas, fotos y audios transcritos.
No inventes datos: cuando falte información escribe "No consta".
Devuelve solo HTML parcial válido, sin bloque Markdown y sin etiquetas <html> ni <body>.
Usa h1, h2, h3, p, ul, ol, table, thead, tbody, tr, th, td, figure, img y figcaption.
Coloca las fotos adjuntas donde corresponda según la plantilla, usando exactamente la URL aportada en cada foto.
""".strip()
    user_prompt = f"""
Genera el borrador de informe final a partir de este JSON.

{json.dumps(payload, ensure_ascii=False, default=_json_default)}
""".strip()
    response = client.responses.create(
        model=settings.OPENAI_MODEL,
        instructions=system_instructions,
        input=user_prompt,
        max_output_tokens=4000,
    )
    html_content = (getattr(response, "output_text", "") or "").strip()
    if html_content.startswith("```"):
        html_content = html_content.strip("`")
        if html_content.lower().startswith("html"):
            html_content = html_content[4:].strip()
    if not html_content:
        raise RuntimeError("La API de OpenAI no devolvió contenido HTML.")
    return html_content


def _all_notes(payload: dict[str, Any]) -> str:
    parts: list[str] = []
    for visit in payload["visits"]:
        if visit.get("text_notes"):
            parts.append(visit["text_notes"])
        if visit.get("audio_transcription"):
            parts.append(visit["audio_transcription"])
        for document in visit.get("documents", []):
            if document.get("extracted_text"):
                parts.append(document["extracted_text"])
    return "\n".join(parts)


def _first_visit_date(payload: dict[str, Any]) -> str:
    visits = payload.get("visits", [])
    return visits[0]["visit_date"] if visits else "No consta"


def _photos(payload: dict[str, Any]) -> list[dict[str, str]]:
    photos: list[dict[str, str]] = []
    for visit in payload.get("visits", []):
        photos.extend(visit.get("photos", []))
    return photos


def _documents(payload: dict[str, Any]) -> list[dict[str, str]]:
    docs: list[dict[str, str]] = []
    for visit in payload.get("visits", []):
        docs.extend(visit.get("documents", []))
    return docs


def _detect_risk(text: str) -> str:
    lower = text.lower()
    if any(token in lower for token in ["urgente", "alto", "riesgo alto", "fractura", "caída", "caida"]):
        return "Alto"
    if any(token in lower for token in ["perforador", "patología", "patologia", "decaimiento", "plaga"]):
        return "Medio"
    return "Bajo"


def _section_html(title: str, body: str) -> str:
    return f"<section><h2>{html.escape(title)}</h2>{body}</section>"


def _generate_fallback_html(payload: dict[str, Any]) -> str:
    project = payload["project"]
    template = payload["template"]
    sections = template.get("sections") or []
    notes = _all_notes(payload)
    risk = _detect_risk(notes)
    photos = _photos(payload)
    docs = _documents(payload)
    title = f"Informe - {project['name']}"

    html_parts = [
        f"<h1>{html.escape(title)}</h1>",
        "<p class=\"muted\">Borrador generado a partir de la plantilla seleccionada, las visitas registradas, documentos, fotos y transcripciones disponibles.</p>",
    ]

    if not sections:
        sections = [
            {"title": "Portada"},
            {"title": "Datos generales"},
            {"title": "Árboles inspeccionados"},
            {"title": "Patologías detectadas"},
            {"title": "Recomendaciones de actuación"},
            {"title": "Anexos"},
        ]

    for raw_section in sections:
        section_title = raw_section.get("title", "Sección") if isinstance(raw_section, dict) else str(raw_section)
        normalized = section_title.lower()

        if "portada" in normalized:
            first_photo = photos[0]["url"] if photos else ""
            image_html = (
                f"<figure><img src=\"{html.escape(first_photo)}\" alt=\"Foto principal del proyecto\"/><figcaption>Imagen principal de la visita.</figcaption></figure>"
                if first_photo
                else ""
            )
            body = f"""
<table>
<tbody>
<tr><th>Proyecto</th><td>{html.escape(project['name'])}</td></tr>
<tr><th>Cliente</th><td>{html.escape(project.get('client') or 'No consta')}</td></tr>
<tr><th>Fecha de visita</th><td>{html.escape(_first_visit_date(payload))}</td></tr>
<tr><th>Plantilla aplicada</th><td>{html.escape(template.get('name') or 'No consta')}</td></tr>
</tbody>
</table>
{image_html}
"""
            html_parts.append(_section_html(section_title, body))

        elif "dato" in normalized or "objetivo" in normalized:
            body = f"""
<p>{html.escape(project.get('description') or 'El presente informe recopila los resultados de las visitas registradas para este proyecto.')}</p>
<ul>
<li><strong>Número de visitas registradas:</strong> {len(payload.get('visits', []))}</li>
<li><strong>Documentos aportados:</strong> {len(docs)}</li>
<li><strong>Fotografías adjuntas:</strong> {len(photos)}</li>
</ul>
"""
            html_parts.append(_section_html(section_title, body))

        elif "árbol" in normalized or "arbol" in normalized or "inspeccion" in normalized:
            gallery = "".join(
                f"<figure><img src=\"{html.escape(photo['url'])}\" alt=\"{html.escape(photo.get('filename', 'Foto'))}\"/><figcaption>{html.escape(photo.get('filename', 'Foto de visita'))}</figcaption></figure>"
                for photo in photos
            )
            body = f"""
<p>Durante la visita se revisaron los elementos vegetales asociados al proyecto. Las observaciones principales fueron:</p>
<blockquote>{html.escape(notes or 'No constan observaciones de campo.')}</blockquote>
<div class=\"photo-grid\">{gallery}</div>
"""
            html_parts.append(_section_html(section_title, body))

        elif "patolog" in normalized or "riesgo" in normalized or "clasific" in normalized:
            body = f"""
<table>
<thead><tr><th>Hallazgo</th><th>Evidencia</th><th>Nivel de riesgo</th></tr></thead>
<tbody>
<tr>
<td>Posible afección fitosanitaria o incidencia detectada en campo</td>
<td>{html.escape(notes[:700] if notes else 'No consta evidencia específica')}</td>
<td><strong>{risk}</strong></td>
</tr>
</tbody>
</table>
"""
            html_parts.append(_section_html(section_title, body))

        elif "actuacion" in normalized or "actuación" in normalized or "urgente" in normalized:
            body = f"""
<table>
<thead><tr><th>Prioridad</th><th>Actuación propuesta</th><th>Responsable sugerido</th></tr></thead>
<tbody>
<tr><td>{risk}</td><td>Inspección técnica de confirmación y seguimiento fitosanitario en la misma zona.</td><td>Técnico responsable / entidad titular</td></tr>
<tr><td>Media</td><td>Documentar evolución con nuevas fotografías y revisión de ejemplares próximos.</td><td>Equipo de campo</td></tr>
</tbody>
</table>
"""
            html_parts.append(_section_html(section_title, body))

        elif "recomend" in normalized:
            body = """
<ul>
<li>Realizar una revisión visual periódica de los ejemplares afectados y colindantes.</li>
<li>Contrastar los indicios con personal técnico especializado antes de aplicar tratamientos.</li>
<li>Registrar próximas visitas con fotografías comparables y notas de evolución.</li>
</ul>
"""
            html_parts.append(_section_html(section_title, body))

        elif "anexo" in normalized or "document" in normalized:
            doc_items = "".join(
                f"<li><a href=\"{html.escape(doc['url'])}\">{html.escape(doc.get('filename', 'Documento'))}</a></li>"
                for doc in docs
            ) or "<li>No constan documentos anexos.</li>"
            body = f"<ul>{doc_items}</ul>"
            html_parts.append(_section_html(section_title, body))

        else:
            body = f"<p>{html.escape(notes[:1000] if notes else 'No consta información específica para esta sección.')}</p>"
            html_parts.append(_section_html(section_title, body))

    return "\n".join(html_parts)
