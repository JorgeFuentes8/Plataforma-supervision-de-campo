import html
import io
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.config import settings


def _clean_text(value: str) -> str:
    return html.escape(" ".join(value.split()))


def _image_bytes_from_src(src: str) -> io.BytesIO | None:
    if not src:
        return None
    local_prefix = f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/uploads/"
    try:
        if src.startswith(local_prefix):
            rel = src[len(local_prefix):]
            candidate = settings.local_upload_path / rel
            if candidate.exists() and candidate.is_file():
                return io.BytesIO(candidate.read_bytes())
        if src.startswith("http://") or src.startswith("https://"):
            response = requests.get(src, timeout=6)
            response.raise_for_status()
            return io.BytesIO(response.content)
        path = Path(src)
        if path.exists() and path.is_file():
            return io.BytesIO(path.read_bytes())
    except Exception:
        return None
    return None


def html_to_pdf_bytes(html_content: str, title: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.6 * cm,
        leftMargin=1.6 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=title,
    )
    styles = getSampleStyleSheet()
    story: list = []
    soup = BeautifulSoup(html_content, "html.parser")

    for element in soup.find_all(["h1", "h2", "h3", "p", "blockquote", "li", "img", "table"], recursive=True):
        if element.find_parent("table") and element.name != "table":
            continue
        if element.name == "h1":
            story.append(Paragraph(_clean_text(element.get_text(" ")), styles["Title"]))
            story.append(Spacer(1, 0.35 * cm))
        elif element.name == "h2":
            story.append(Paragraph(_clean_text(element.get_text(" ")), styles["Heading2"]))
            story.append(Spacer(1, 0.2 * cm))
        elif element.name == "h3":
            story.append(Paragraph(_clean_text(element.get_text(" ")), styles["Heading3"]))
        elif element.name in {"p", "blockquote", "li"}:
            prefix = "• " if element.name == "li" else ""
            story.append(Paragraph(prefix + _clean_text(element.get_text(" ")), styles["BodyText"]))
            story.append(Spacer(1, 0.12 * cm))
        elif element.name == "img":
            image_data = _image_bytes_from_src(element.get("src", ""))
            if image_data:
                try:
                    image = Image(image_data)
                    image._restrictSize(15 * cm, 8 * cm)
                    story.append(image)
                    story.append(Spacer(1, 0.25 * cm))
                except Exception:
                    story.append(Paragraph("[Imagen adjunta no renderizable en PDF]", styles["BodyText"]))
        elif element.name == "table":
            rows: list[list[str]] = []
            for tr in element.find_all("tr"):
                row = [_clean_text(cell.get_text(" ")) for cell in tr.find_all(["th", "td"])]
                if row:
                    rows.append(row)
            if rows:
                table = Table(rows, repeatRows=1)
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ecfdf5")),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f3b2e")),
                            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d1d5db")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 6),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                        ]
                    )
                )
                story.append(table)
                story.append(Spacer(1, 0.35 * cm))

    if not story:
        story.append(Paragraph("Informe sin contenido.", styles["BodyText"]))
    doc.build(story)
    return buffer.getvalue()
