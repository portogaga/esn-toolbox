from typing import Literal, Optional
from pydantic import BaseModel, Field

# --- OUTIL 1 bis : CALCULATEUR DE CJM RAPIDE ---
class CJMRequest(BaseModel):
    salaire_net_mensuel: float = Field(..., gt=0, description="Salaire net mensuel demandé")
    pays: Literal["FR", "MA"] = Field(default="MA", description="Code pays: 'FR' ou 'MA'")

class SimulateurRequest(BaseModel):
    cjm: Optional[float] = None
    tjm: Optional[float] = None
    marge_percent: Optional[float] = None

# --- NOUVEAU : Les données pour le calcul du Banc ---
class BancRequest(BaseModel):
    cjm: float
    tjm: float
    jours_banc: int


class SimulateurRequest(BaseModel):
    """Schéma pour le simulateur : exactement 2 valeurs parmi CJM, TJM, Marge."""
    cjm: Optional[float] = Field(None, ge=0, description="Coût journalier moyen (€/jour)")
    tjm: Optional[float] = Field(None, ge=0, description="Taux journalier moyen (€/jour)")
    marge_percent: Optional[float] = Field(None, gt=0, lt=100, description="Marge cible (%)")


# --- NOUVEAU : Les données pour le calcul de Licenciement (Normes FR) ---
# --- OUTIL 4 : COÛT DE LICENCIEMENT (PRO/COMPLET) ---
# --- OUTIL 4 : COÛT DE LICENCIEMENT (MULTI-PAYS) ---
class LicenciementRequest(BaseModel):
    pays: str = Field(default="FR", description="Code pays: 'FR' ou 'MA'")
    salaire_brut_mensuel: float = Field(..., gt=0)
    annees_anciennete: float = Field(..., ge=0)
    mois_preavis: int = Field(default=3, ge=0)
    jours_cp_restants: float = Field(default=0.0, ge=0)
    licenciement_abusif: bool = Field(default=False)

    # --- OUTIL 5 : COMPARATEUR CDI vs FREELANCE ---
class ComparateurRequest(BaseModel):
    tjm_client: float = Field(..., gt=0, description="TJM facturé au client final")
    tjm_freelance: float = Field(..., gt=0, description="TJF (Tarif payé au freelance)")
    salaire_brut_mensuel_cdi: float = Field(..., gt=0, description="Salaire brut mensuel pour le CDI")
    duree_mois: int = Field(default=6, gt=0, description="Durée estimée de la mission en mois")


    # --- OUTIL 6 : CALCULATEUR DE TACE & RENTABILITÉ ANNUELLE ---
class TACERequest(BaseModel):
    jours_ouvres: int = Field(default=251, gt=0, description="Jours ouvrés dans l'année (moyenne 251)")
    jours_conges_feries: int = Field(default=35, ge=0, description="Congés payés + RTT + Fériés (moyenne 35)")
    jours_intercontrat: int = Field(default=0, ge=0, description="Jours passés sur le banc")
    jours_formation: int = Field(default=0, ge=0, description="Jours en formation ou projets internes (non facturés)")
    tjm: float = Field(..., gt=0, description="TJM moyen du consultant")


# --- OUTIL 7 : SIMULATEUR SPLIT CONTRACT (MAROC UNIQUEMENT) ---
class SplitContractRequest(BaseModel):
    cjm: float = Field(..., gt=0, description="Coût Journalier Moyen du consultant")
    net_declare: int = Field(..., description="Salaire net sélectionné dans la grille stricte")


class ScoreResult(BaseModel):
    nom_candidat: str = Field(description="Nom du candidat tel qu'identifié sur le CV")
    score_pourcentage: int = Field(
        ge=0,
        le=100,
        description="Pourcentage de compatibilité CV / fiche de poste (0 à 100)",
    )
    points_forts: list[str] = Field(
        default_factory=list,
        description="Atouts et correspondances réelles avec la fiche de poste",
    )
    competences_manquantes: list[str] = Field(
        default_factory=list,
        description="Exigences de la fiche non couvertes ou insuffisamment démontrées sur le CV",
    )
    justification_courte: str = Field(
        description="Synthèse en quelques phrases expliquant le score de façon factuelle"
    )


class SkillCategory(BaseModel):
    nom_categorie: str = Field(description="Nom de la catégorie de compétences (ex: Réseaux, Sécurité, Cloud)")
    elements: list[str] = Field(
        default_factory=list,
        description="Liste des compétences, outils ou technologies de la catégorie."
    )


class Formation(BaseModel):
    annee: str = Field(
        description="Période du diplôme en chiffres : MM/YYYY ou MM/YYYY - MM/YYYY (ex. 09/2018 - 06/2020). Ne pas écrire les mois en toutes lettres."
    )
    diplome: str = Field(description="Intitulé du diplôme")
    ecole: str = Field(description="Nom de l'école, université ou établissement")


class Experience(BaseModel):
    entreprise: str = Field(
        default="",
        description="Nom de l'entreprise (ESN/employeur). Laisser vide si introuvable."
    )
    client: str = Field(
        default="",
        description="Nom du client final si mentionné. Optionnel: laisser vide si absent."
    )
    titre_poste: str = Field(
        default="",
        description="Intitulé exact du poste occupé. Laisser vide si introuvable."
    )
    date: str = Field(
        default="",
        description="Période d'emploi en chiffres : MM/YYYY ou MM/YYYY - MM/YYYY (ex. 08/2021 - 05/2024). Ne pas écrire les mois en toutes lettres."
    )
    projet: str = Field(
        default="",
        description="Courte phrase décrivant le projet global de la mission."
    )
    role_detail: str = Field(
        default="",
        description="Rôle exact joué par le consultant dans la mission."
    )
    contexte: str = Field(
        default="",
        description="Contexte et enjeux de la mission en 1 à 2 phrases."
    )
    objectifs: str = Field(
        default="",
        description="Objectifs de la mission en 1 à 2 phrases."
    )
    realisations: list[str] = Field(
        default_factory=list,
        description="Liste des tâches techniques réalisées."
    )
    resultats: list[str] = Field(
        default_factory=list,
        description="Liste des impacts, résultats et KPIs obtenus."
    )
    environnement: str = Field(
        default="",
        description="Stack technique sous forme de chaîne, séparée par ' | ' (ex: GitLab CI | Jenkins | Terraform)."
    )


class ProfilCandidat(BaseModel):
    nom_complet: str = Field(description="Prénom et nom du candidat")
    annees_experience: int = Field(description="Nombre d'années d'expérience professionnelle")
    titre_profil: str = Field(description="Titre professionnel actuel ou visé")
    resume: str = Field(description="Résumé du profil professionnel en quelques phrases")
    competences_techniques: list[SkillCategory] = Field(
        default_factory=list,
        description="Compétences techniques regroupées par catégories (ex: Langages, DevOps, Cloud)."
    )
    competences_fonctionnelles: list[str] = Field(
        default_factory=list,
        description="Compétences fonctionnelles: méthodologies, pilotage, expertise métier, communication, etc."
    )
    formations: list[Formation] = Field(
        default_factory=list,
        description="Parcours académique (écoles, universités, diplômes)."
    )
    certifications: list[str] = Field(
        default_factory=list,
        description="Liste des certifications professionnelles (ex: Cisco, AWS, Scrum, Huawei)."
    )
    experiences: list[Experience] = Field(
        description="Expériences professionnelles ordonnées de la plus récente à la plus ancienne"
    )


class ExtractCvWordParams(BaseModel):
    """Paramètres du formulaire multipart pour la génération Word (/extract-cv), hors fichier PDF."""

    template_type: str = Field(
        default="detailed",
        description="Type de modèle Word : 'detailed' (défaut) ou 'simplified'.",
    )
