import os
import json
from pathlib import Path
from dotenv import load_dotenv
import instructor
from google import genai
from google.oauth2 import service_account
from schemas import ProfilCandidat, ScoreResult

# Modèle Vertex utilisé (surchargeable via variable d'env)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# 1. Chargement robuste du fichier .env (backend/.env) pour le dev local
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# 2. Projet / région Vertex AI
gcp_project_id = os.getenv("GCP_PROJECT_ID")
gcp_location = os.getenv("GCP_LOCATION")
if not gcp_project_id or not gcp_location:
    raise ValueError(
        "ERREUR : Variables Vertex AI introuvables.\n"
        "Vérifie que ton environnement contient : GCP_PROJECT_ID et GCP_LOCATION."
    )

# 3. Credentials.
#    - En prod (Render) : le JSON complet de la clé de service account est fourni
#      dans la variable d'env GOOGLE_CREDENTIALS_JSON (aucun fichier de clé dans le repo).
#    - En local : si GOOGLE_CREDENTIALS_JSON est absent, on retombe sur l'ADC
#      (ex. `gcloud auth application-default login`).
credentials = None
creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
if creds_json:
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(creds_json),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )

# 4. Client google-genai sur backend Vertex AI, enveloppé par instructor.
#    (instructor.from_vertexai a été retiré ; on passe par from_genai.)
genai_client = genai.Client(
    vertexai=True,
    project=gcp_project_id,
    location=gcp_location,
    credentials=credentials,
)

client = instructor.from_genai(
    genai_client,
    mode=instructor.Mode.GENAI_TOOLS,
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
    Modèle par défaut : gemini-2.5-flash (surcharge possible via GEMINI_MODEL).
    """
    user_content = (
        "--- Fiche de poste / besoin ---\n\n"
        f"{fiche_poste.strip()}\n\n"
        "--- Texte du CV ---\n\n"
        f"{texte_cv.strip()}"
    )

    merged_user_content = f"{SYSTEM_PROMPT_SCORING}\n\n{user_content}"
    return client.create(
        model=GEMINI_MODEL,
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
        model=GEMINI_MODEL,
        messages=[
            {"role": "user", "content": merged_user_content},
        ],
        response_model=ProfilCandidat,
    )
