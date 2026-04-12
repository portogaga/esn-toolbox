"""Normalise les dates de CV vers MM/YYYY (chiffres) pour le rendu Word."""

from __future__ import annotations

import re
import unicodedata

_MONTH_FR: dict[str, int] = {
    "janvier": 1,
    "fevrier": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "aout": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "decembre": 12,
}

_MONTH_RX = (
    r"(?i)\b(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|"
    r"septembre|octobre|novembre|décembre|decembre)\s+(\d{4})\b"
)


def _strip_accents(s: str) -> str:
    n = unicodedata.normalize("NFD", s.lower().strip())
    return "".join(c for c in n if unicodedata.category(c) != "Mn")


def _month_num(name: str) -> int | None:
    return _MONTH_FR.get(_strip_accents(name))


def _pad_mm_yyyy(m: int, y: str) -> str:
    return f"{int(m):02d}/{y}"


def _try_numeric_range(s: str) -> str | None:
    """Déjà au format chiffres : normalise les espaces et le zéro devant le mois."""
    compact = re.sub(r"\s+", "", s)
    m = re.fullmatch(r"(\d{1,2})/(\d{4})(?:[-–/](\d{1,2})/(\d{4}))?", compact)
    if not m:
        return None
    a, y1, c, y2 = m.group(1), m.group(2), m.group(3), m.group(4)
    left = _pad_mm_yyyy(int(a), y1)
    if c and y2:
        return f"{left} - {_pad_mm_yyyy(int(c), y2)}"
    return left


def _french_month_year_pairs(s: str) -> list[tuple[str, str]]:
    return [(g.group(1), g.group(2)) for g in re.finditer(_MONTH_RX, s)]


def normalize_cv_date_string(s: str) -> str:
    """
    Convertit les périodes du type « Août 2021 - Mai 2024 » en « 08/2021 - 05/2024 ».
    Laisse inchangé si le format n'est pas reconnu (sauf plage déjà numérique qu'on pad).
    """
    s = (s or "").strip()
    if not s:
        return s

    num = _try_numeric_range(s)
    if num is not None:
        return num

    parts = re.split(r"\s*[-–—]\s*", s)
    out: list[str] = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        if re.search(r"(?i)^(present|présent|en\s+cours)$", p):
            out.append("Présent")
            continue
        m = re.search(_MONTH_RX, p)
        if m and m.start() == 0 and m.end() == len(p):
            mo = _month_num(m.group(1))
            if mo:
                out.append(_pad_mm_yyyy(mo, m.group(2)))
            else:
                return s
        elif re.fullmatch(r"\d{1,2}/\d{4}", re.sub(r"\s+", "", p)):
            mm, yy = re.sub(r"\s+", "", p).split("/")
            out.append(_pad_mm_yyyy(int(mm), yy))
        else:
            return s

    return " - ".join(out) if out else s


def normalize_profil_dates_for_template(data: dict) -> None:
    """Modifie le dict issu de model_dump() en place pour les champs date/annee."""
    for exp in data.get("experiences") or []:
        if isinstance(exp.get("date"), str):
            exp["date"] = normalize_cv_date_string(exp["date"])
    for edu in data.get("education") or []:
        if isinstance(edu.get("annee"), str):
            edu["annee"] = normalize_cv_date_string(edu["annee"])
