from docxtpl import DocxTemplate

from schemas import ProfilCandidat


def generer_word(donnees: ProfilCandidat, template_path: str, output_path: str) -> None:
    doc = DocxTemplate(template_path)
    doc.render(donnees.model_dump())
    doc.save(output_path)
