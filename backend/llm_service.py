import os
from pathlib import Path
from dotenv import load_dotenv
import instructor
from google import genai
from schemas import ProfilCandidat, ScoreResult

# 1. Chargement robuste du fichier .env
# On s'assure de chercher le .env dans le dossier racine du projet
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Récupération de la clé API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError(
        "ERREUR : La clé GOOGLE_API_KEY est introuvable.\n"
        "Vérifie que ton fichier .env contient exactement : GOOGLE_API_KEY=ta_cle"
    )

# 3. Initialisation du nouveau client Google GenAI (v2026)
google_client = genai.Client(api_key=api_key)

# 4. Initialisation d'Instructor avec le nouveau mode 'STRUCTURED_OUTPUTS'
client = instructor.from_genai(
    client=google_client,
    mode=instructor.Mode.GENAI_STRUCTURED_OUTPUTS,
)

SYSTEM_PROMPT = """
Tu es un expert en recrutement IT pour Maltem Africa. 
Ta mission est d'analyser un CV brut et d'extraire les données de manière structurée.

RÈGLES CRITIQUES :
- PAS D'HALLUCINATION : Si une information n'est pas dans le texte, laisse le champ vide.
- CATÉGORIES : Regroupe intelligemment les technos (ex: 'Backend', 'Cloud', 'DevOps').
- RÉSUMÉ : Rédige une présentation professionnelle et percutante du candidat.
- FORMAT : Respecte scrupuleusement le schéma Pydantic fourni.

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
    Modèle par défaut : gemini-pro (surcharge possible via GEMINI_MODEL_SCORE si indisponible).
    """
    model_id = os.getenv("GEMINI_MODEL_SCORE", "gemini-2.5-flash")

    user_content = (
        "--- Fiche de poste / besoin ---\n\n"
        f"{fiche_poste.strip()}\n\n"
        "--- Texte du CV ---\n\n"
        f"{texte_cv.strip()}"
    )

    return client.chat.completions.create(
        model=model_id,
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

    return client.chat.completions.create(
        model=model_id,
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