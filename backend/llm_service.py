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

client = instructor.from_vertexai(
    client=GenerativeModel("gemini-2.5-flash"),
    mode=instructor.Mode.VERTEXAI_TOOLS,
)

SYSTEM_PROMPT = """
Tu es un expert en recrutement IT de haut niveau au sein d'une ESN. Ton rôle est d'analyser le texte fourni (CV brut, Fiche de Poste ou Appel d'Offres) et de le structurer parfaitement selon le schéma JSON attendu.
RÈGLES ABSOLUES :

RÈGLE 1 : ANALYSE DU TYPE DE DOCUMENT ET STRATÉGIE ADAPTÉE. Avant de générer les données, tu dois déterminer la nature du texte soumis.

CAS A (Le texte est une Fiche de Poste, un Appel d'Offres ou une demande client) : Applique la stratégie de REVERSE-ENGINEERING. Transforme les prérequis et missions futures en expériences passées accomplies, de manière crédible.

CAS B (Le texte est un CV classique ou un profil brut) : Applique la stratégie d'EXTRACTION PURE. Contente-toi de structurer fidèlement les informations au format ESN. Améliore la syntaxe et mets en valeur les compétences, mais NE TRANSFORME PAS les données et ne crée pas de contexte fictif lié à une offre. Reste strictement fidèle au parcours du candidat.

AUCUN CHAMP VIDE : Tu dois déduire et extrapoler intelligemment les informations manquantes (contexte, objectifs, environnement) en te basant sur le rôle et les standards de l'industrie.

REVERSE-ENGINEERING : Si le texte est une fiche de poste/appel d'offres (ex: missions futures, prérequis), transforme-le en expérience PASSÉE et ACCOMPLIE. Transforme les prérequis en réalisations concrètes (ex: 'Concevoir le réseau' devient 'Conception et maintenance du réseau').

SÉPARATION DES COMPÉTENCES : C'est vital. Analyse minutieusement le texte pour extraire TOUTES les compétences.

Place les outils, technos, protocoles (ex: AWS, VMware, TCP/IP, Python) dans competences_techniques en les regroupant par catégories logiques (Cloud, Réseau, Dev, etc.).

Place les méthodologies, le pilotage, l'agilité et l'expertise métier (ex: Agile, Gestion de projet, Analyse de données) dans competences_fonctionnelles.
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
    user_content = (
        "--- Fiche de poste / besoin ---\n\n"
        f"{fiche_poste.strip()}\n\n"
        "--- Texte du CV ---\n\n"
        f"{texte_cv.strip()}"
    )

    merged_user_content = f"{SYSTEM_PROMPT_SCORING}\n\n{user_content}"
    return client.create(
        messages=[
            {"role": "user", "content": merged_user_content},
        ],
        response_model=ScoreResult,
    )


def extraire_cv(texte_brut: str, fiche_poste: str | None = None) -> ProfilCandidat:
    """
    Analyse le texte et retourne l'objet structuré pour le template Word.
    Si ``fiche_poste`` est renseignée, le profil est orienté vers ce besoin (sans invention).
    """
    user_content = f"Voici le texte brut du CV à traiter :\n\n{texte_brut}"
    if fiche_poste and fiche_poste.strip():
        user_content += (
            "\n\n--- Fiche de poste (cible le CV sur ce besoin) ---\n\n"
            f"{fiche_poste.strip()}"
        )

    merged_user_content = f"{SYSTEM_PROMPT}\n\n{user_content}"
    return client.create(
        messages=[
            {"role": "user", "content": merged_user_content},
        ],
        response_model=ProfilCandidat,
    )
