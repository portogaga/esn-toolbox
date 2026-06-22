import io
import zipfile
from pathlib import Path

from docxtpl import DocxTemplate

from cv_date_format import normalize_profil_dates_for_template
from schemas import ProfilCandidat


def _strip_last_rendered_page_breaks(docx_path: str) -> None:
    # Retire w:lastRenderedPageBreak (marqueur Word qui provoque des blancs après reflow / docxtpl).
    p = Path(docx_path)
    buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(p.read_bytes()), "r") as zin:
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for info in zin.infolist():
                b = zin.read(info.filename)
                if info.filename == "word/document.xml":
                    s = b.decode("utf-8")
                    s = s.replace("<w:lastRenderedPageBreak/>", "")
                    b = s.encode("utf-8")
                zi = zipfile.ZipInfo(filename=info.filename)
                zi.compress_type = zipfile.ZIP_DEFLATED
                zi.external_attr = info.external_attr
                zout.writestr(zi, b)
    p.write_bytes(buf.getvalue())


def generer_word(donnees: ProfilCandidat, template_path: str, output_path: str) -> None:
    doc = DocxTemplate(template_path)
    ctx = donnees.model_dump()
    normalize_profil_dates_for_template(ctx)
    doc.render(ctx, autoescape=True)
    doc.save(output_path)
    _strip_last_rendered_page_breaks(output_path)
