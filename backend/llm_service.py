import os
from pathlib import Path
from dotenv import load_dotenv
import instructor
import vertexai
from vertexai.generative_models import GenerativeModel
from schemas import ProfilCandidat, ScoreResult

# 1. Chargement robuste du fichier .env (backend/.env)
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# 2. Initialisation Vertex AI (variables chargées via dotenv)
gcp_project_id = os.getenv("GCP_PROJECT_ID")
gcp_location = os.getenv("GCP_LOCATION")
if not gcp_project_id or not gcp_location:
    raise ValueError(
        "ERREUR : Variables Vertex AI introuvables.\n"
        "Vérifie que ton fichier .env contient : GCP_PROJECT_ID et GCP_LOCATION."
    )

vertexai.init(project=gcp_project_id, location=gcp_location)


def _vertex_client(model_id: str):
    model = GenerativeModel(model_id)
    return instructor.from_vertexai(
        client=model,
        mode=instructor.Mode.VERTEXAI_JSON,
    )

SYSTEM_PROMPT = """
Tu es un expert en recrutement IT. 
Ta mission est d'analyser un CV brut et d'extraire les données de manière structurée.

RÈGLES CRITIQUES :
- PAS D'HALLUCINATION : Si une information n'est pas dans le texte, laisse le champ vide.
- CATÉGORIES : Regroupe intelligemment les technos (ex: 'Backend', 'Cloud', 'DevOps').
- RÉSUMÉ : Rédige une présentation professionnelle et percutante du candidat.
- FORMAT : Respecte scrupuleusement le schéma Pydantic fourni.

DATES (chiffres uniquement, format MM/YYYY) :
- Pour chaque expérience, le champ « date » doit être au format **MM/YYYY** (mois sur 2 chiffres, année sur 4), jamais le nom du mois en lettres (pas « Août 2021 », pas « Aout 2021 »).
- Plage : **MM/YYYY - MM/YYYY** (ex. `08/2021 - 05/2024`). Poste en cours : **MM/YYYY - Présent** (ex. `03/2022 - Présent`).
- Même logique pour les diplômes : le champ « annee » de chaque entrée « education » en **MM/YYYY** ou plage **MM/YYYY - MM/YYYY**.

EXPÉRIENCES PROFESSIONNELLES — champ JSON exact « description » (liste de chaînes) :
- Pour chaque expérience, remplis le champ « description » avec une liste (array) de 3 à 5 chaînes : ce sont les bullet points des missions.
- Ne mets pas un seul bloc de texte : toujours plusieurs entrées dans la liste « description ».
- Chaque chaîne = une puce percutante (réalisations mesurables ou livrables, verbes d'action, mots-clés techniques du CV : stack, outils, normes).
- Pas de redite entre les puces ; pas d'invention ; une puce peut résumer plusieurs lignes du CV si c'est factuel.

ORIENTATION FICHE DE POSTE :
Si une fiche de poste est fournie, tu dois mettre en valeur les expériences et les compétences du candidat qui correspondent spécifiquement à cette fiche de poste. Réécris le résumé du candidat pour qu'il cible ce besoin. Règle absolue : Ne mens pas, n'invente aucune compétence que le candidat n'a pas, contente-toi de réorganiser et de valoriser l'existant.
"""

SYSTEM_PROMPT_SCORING = """
Tu es un expert RH senior, spécialisé dans l'évaluation objective de candidatures techniques.

MISSION : comparer le texte d'un CV à une fiche de poste / appel d'offres et produire un score structuré.

EXIGENCES :
- Sois SÉVÈRE et OBJECTIF : base-toi uniquement sur ce qui est explicitement ou clairement déductible du CV.
- Attribue un score_pourcentage RÉALISTE (0 à 100) reflétant l'adéquation globale au besoin décrit dans la fiche.
- points_forts : uniquement des éléments du CV qui correspondent réellement à la fiche (expériences, outils, contextes).
- competences_manquantes : exigences ou compétences demandées dans la fiche qui ne figurent pas (ou pas de manière crédible) sur le CV.
- justification_courte : quelques phrases factuelles qui expliquent le score, sans flatterie ni invention.
- Ne crée pas de compétences ou d'expériences absentes du CV. Si le nom du candidat est absent, utilise « Non identifié ».
"""


def scorer_cv(texte_cv: str, fiche_poste: str) -> ScoreResult:
    """
    Compare un CV (texte) à une fiche de poste et retourne un score structuré.
    Modèle par défaut : gemini-2.5-flash (surcharge possible via GEMINI_MODEL_SCORE).
    """
    model_id = os.getenv("GEMINI_MODEL_SCORE", "gemini-2.5-flash")

    user_content = (
        "--- Fiche de poste / besoin ---\n\n"
        f"{fiche_poste.strip()}\n\n"
        "--- Texte du CV ---\n\n"
        f"{texte_cv.strip()}"
    )

    client = _vertex_client(model_id)
    return client.chat.completions.create(
        config={
            "max_output_tokens": 2048,
            "temperature": 0.15,
        },
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_SCORING},
            {"role": "user", "content": user_content},
        ],
        response_model=ScoreResult,
    )


def extraire_cv(texte_brut: str, fiche_poste: str | None = None) -> ProfilCandidat:
    """
    Analyse le texte et retourne l'objet structuré pour le template Word.
    Si ``fiche_poste`` est renseignée, le profil est orienté vers ce besoin (sans invention).
    """
    # Anciens IDs (gemini-pro, gemini-2.0-flash pour nouveaux comptes) → 404.
    # Défaut : modèle actuellement ouvert aux nouveaux utilisateurs. Surcharge : GEMINI_MODEL.
    model_id = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    user_content = f"Voici le texte brut du CV à traiter :\n\n{texte_brut}"
    if fiche_poste and fiche_poste.strip():
        user_content += (
            "\n\n--- Fiche de poste (cible le CV sur ce besoin) ---\n\n"
            f"{fiche_poste.strip()}"
        )

    client = _vertex_client(model_id)
    return client.chat.completions.create(
        config={
            "max_output_tokens": 4096,
            "temperature": 0.1,
        },
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_model=ProfilCandidat,
    )
