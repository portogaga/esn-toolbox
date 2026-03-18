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