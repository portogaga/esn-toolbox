import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from pdf_service import extraire_texte_pdf
from schemas import (
    CJMRequest,
    SimulateurRequest,
    BancRequest,
    LicenciementRequest,
    ComparateurRequest,
    TACERequest,
    SplitContractRequest,
)
from word_service import generer_word

BASE_DIR = Path(__file__).resolve().parent
TEMP_UPLOADS = BASE_DIR / "temp_uploads"
TEMP_OUTPUTS = BASE_DIR / "temp_outputs"
TEMPLATE_CV_PATH = BASE_DIR / "templates" / "template_maltem.docx"


@asynccontextmanager
async def lifespan(app: FastAPI):
    TEMP_UPLOADS.mkdir(parents=True, exist_ok=True)
    TEMP_OUTPUTS.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="ESN Toolbox API - Moteur BizDev", lifespan=lifespan)

@app.get("/")
def keep_alive():
    return {"status": "Moteur ESN Toolbox actif"}
# Crucial pour connecter React plus tard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OUTIL 1 bis : CALCULATEUR DE CJM RAPIDE (FR/MA) ---
@app.post("/calcul-cjm-rapide")
def calcul_cjm_rapide(data: CJMRequest):
    # Validation explicite du pays (FR ou MA uniquement)
    if data.pays not in ("FR", "MA"):
        raise HTTPException(
            status_code=400,
            detail=f"Pays non pris en charge: '{data.pays}'. Utilisez 'FR' ou 'MA'.",
        )
    # Base prudente de 20 jours facturables par mois
    jours_moyens_facturables = 20.0
    if data.pays == "MA":
        # Coefficient Maroc (1.7) : Couvre Net -> Brut + CNSS/AMO + Frais annexes
        coefficient_charges = 1.7
    else:
        # data.pays == "FR" : Coefficient France (1.9)
        coefficient_charges = 1.9

    cout_total_mensuel_estime = data.salaire_net_mensuel * coefficient_charges
    cjm_estime = cout_total_mensuel_estime / jours_moyens_facturables

    return {
        "pays_applique": data.pays,
        "salaire_net_base": data.salaire_net_mensuel,
        "coefficient_utilise": coefficient_charges,
        "cout_total_mensuel_estime": round(cout_total_mensuel_estime, 2),
        "cjm_estime": round(cjm_estime, 2)
    }

# --- OUTIL 2 : LE SIMULATEUR ABC (Marge, TJM, CJM) ---
@app.post("/simulateur")
def simulateur(data: SimulateurRequest):
    cjm = data.cjm
    tjm = data.tjm
    marge = data.marge_percent

    # MODE 0 : On a le CJM et le TJM -> On calcule la Marge et le Gain
    if cjm is not None and tjm is not None and marge is None:
        if tjm <= cjm:
            raise HTTPException(status_code=400, detail="Le TJM doit être supérieur au CJM")
        
        marge_calc = ((tjm - cjm) / tjm) * 100
        gain = tjm - cjm
        
        return {
            "cjm": cjm,
            "tjm": tjm,
            "marge_percent": round(marge_calc, 2),
            "gain": round(gain, 2),
            "mode": "Calcul de Marge"
        }

    # MODE 1 : On a le CJM et la Marge -> On calcule le TJM Cible
    elif cjm is not None and marge is not None and tjm is None:
        if marge >= 100 or marge <= 0:
            raise HTTPException(status_code=400, detail="La marge doit être entre 0 et 99%")
            
        tjm_calc = cjm / (1 - (marge / 100))
        gain = tjm_calc - cjm
        
        return {
            "cjm": cjm,
            "tjm": round(tjm_calc, 2),
            "marge_percent": marge,
            "gain": round(gain, 2),
            "mode": "Calcul de TJM"
        }

    # MODE 2 : On a le TJM et la Marge -> On calcule le CJM Max
    elif tjm is not None and marge is not None and cjm is None:
        if marge >= 100 or marge <= 0:
            raise HTTPException(status_code=400, detail="La marge doit être entre 0 et 99%")
            
        cjm_calc = tjm * (1 - (marge / 100))
        gain = tjm - cjm_calc
        
        return {
            "cjm": round(cjm_calc, 2),
            "tjm": tjm,
            "marge_percent": marge,
            "gain": round(gain, 2),
            "mode": "Calcul de CJM Max"
        }
        
    # SÉCURITÉ : Si l'utilisateur fait n'importe quoi
    else:
        raise HTTPException(
            status_code=400, 
            detail="Veuillez fournir exactement 2 valeurs parmi CJM, TJM et Marge."
        )

# --- OUTIL 3 : IMPACT DE L'INTER-CONTRAT (LE BANC) ---
@app.post("/calcul-banc")
def calcul_banc(data: BancRequest):
    # Sécurité : Si on vend à perte, on ne rattrapera jamais le banc !
    if data.tjm <= data.cjm:
        raise HTTPException(
            status_code=400, 
            detail="Le TJM doit être strictement supérieur au CJM pour absorber le banc."
        )
    if data.jours_banc < 0:
        raise HTTPException(
            status_code=400, 
            detail="Le nombre de jours de banc ne peut pas être négatif."
        )

    # Application des formules mathématiques
    cout_total_banc = data.jours_banc * data.cjm
    marge_journaliere = data.tjm - data.cjm
    jours_necessaires = cout_total_banc / marge_journaliere

    return {
        "cjm": data.cjm,
        "tjm": data.tjm,
        "jours_banc": data.jours_banc,
        "cout_total_banc": round(cout_total_banc, 2),
        "marge_journaliere": round(marge_journaliere, 2),
        # On arrondit à 1 chiffre après la virgule (ex: 12.5 jours)
        "jours_facturation_necessaires": round(jours_necessaires, 1) 
    }

# --- OUTIL 4 : COÛT DE LICENCIEMENT (NORMES FRANÇAISES) ---
@app.post("/calcul-licenciement")
def calcul_licenciement(data: LicenciementRequest):
    salaire = data.salaire_brut_mensuel
    anciennete = data.annees_anciennete
    
    indemnite_licenciement = 0.0
    cout_preavis_total = 0.0
    cout_iccp_total = 0.0
    risque_prudhommes = 0.0

    # ==========================================
    # LOGIQUE FRANCE (FR)
    # ==========================================
    if data.pays == "FR":
        # 1. Indemnité légale
        if anciennete >= (8 / 12):
            if anciennete <= 10:
                indemnite_licenciement = (1/4) * salaire * anciennete
            else:
                indemnite_licenciement = ((1/4) * salaire * 10) + ((1/3) * salaire * (anciennete - 10))

        # 2. Charges (45%)
        cout_preavis_total = (salaire * data.mois_preavis) * 1.45
        cout_iccp_total = ((salaire / 21.67) * data.jours_cp_restants) * 1.45

        # 3. Risque Abusif (Barème Macron max ~20 mois)
        if data.licenciement_abusif:
            if anciennete < 1: mois_dedommagement = 1
            elif anciennete < 2: mois_dedommagement = 2
            elif anciennete <= 10: mois_dedommagement = int(anciennete)
            else: mois_dedommagement = min(10 + (anciennete - 10) * 0.5, 20.0)
            risque_prudhommes = salaire * mois_dedommagement

    # ==========================================
    # LOGIQUE MAROC (MA)
    # ==========================================
    elif data.pays == "MA":
        # 1. Indemnité légale (Base: 191h / mois)
        taux_horaire = salaire / 191
        if anciennete >= 0.5: # 6 mois minimum légal en général
            # Calcul simplifié proportionnel
            if anciennete <= 5:
                indemnite_licenciement = 96 * taux_horaire * anciennete
            elif anciennete <= 10:
                indemnite_licenciement = (96 * taux_horaire * 5) + (144 * taux_horaire * (anciennete - 5))
            elif anciennete <= 15:
                indemnite_licenciement = (96 * taux_horaire * 5) + (144 * taux_horaire * 5) + (192 * taux_horaire * (anciennete - 10))
            else:
                indemnite_licenciement = (96 * taux_horaire * 5) + (144 * taux_horaire * 5) + (192 * taux_horaire * 5) + (240 * taux_horaire * (anciennete - 15))

        # 2. Charges (Base ~21% CNSS/AMO)
        cout_preavis_total = (salaire * data.mois_preavis) * 1.21
        # Base 26 jours ouvrables pour les CP au Maroc
        cout_iccp_total = ((salaire / 26) * data.jours_cp_restants) * 1.21

        # 3. Risque Abusif (Dommages et intérêts : 1.5 mois / an, max 36 mois)
        if data.licenciement_abusif:
            mois_dedommagement = min(anciennete * 1.5, 36.0)
            risque_prudhommes = salaire * mois_dedommagement

    # Coût Total
    cout_total_entreprise = indemnite_licenciement + cout_preavis_total + cout_iccp_total + risque_prudhommes

    return {
        "pays_applique": data.pays,
        "indemnite_legale_nette": round(indemnite_licenciement, 2),
        "cout_preavis_total": round(cout_preavis_total, 2),
        "cout_iccp_total": round(cout_iccp_total, 2),
        "risque_prudhommes_max": round(risque_prudhommes, 2),
        "cout_total_entreprise": round(cout_total_entreprise, 2)
    }

    # --- OUTIL 5 : COMPARATEUR CDI vs FREELANCE ---
@app.post("/calcul-comparateur")
def calcul_comparateur(data: ComparateurRequest):
    jours_par_mois = 20 # Base moyenne de jours facturables par mois
    jours_totaux = data.duree_mois * jours_par_mois
    
    # 1. Chiffre d'Affaires Global
    ca_total = data.tjm_client * jours_totaux
    
    # 2. Scénario FREELANCE (Sous-traitant)
    cout_total_freelance = data.tjm_freelance * jours_totaux
    marge_brute_freelance = ca_total - cout_total_freelance
    marge_pourcent_freelance = (marge_brute_freelance / ca_total) * 100 if ca_total > 0 else 0
    
    # 3. Scénario CDI (Interne) - Base de 45% de charges patronales
    cout_mensuel_cdi = data.salaire_brut_mensuel_cdi * 1.45
    cout_total_cdi = cout_mensuel_cdi * data.duree_mois
    marge_brute_cdi = ca_total - cout_total_cdi
    marge_pourcent_cdi = (marge_brute_cdi / ca_total) * 100 if ca_total > 0 else 0
    
    # 4. Analyse et Recommandation
    meilleur_choix = "CDI" if marge_brute_cdi > marge_brute_freelance else "Freelance"
    diff_marge = abs(marge_brute_cdi - marge_brute_freelance)

    return {
        "ca_total": round(ca_total, 2),
        "jours_totaux": jours_totaux,
        "freelance": {
            "cout_total": round(cout_total_freelance, 2),
            "marge_brute": round(marge_brute_freelance, 2),
            "marge_pourcent": round(marge_pourcent_freelance, 1)
        },
        "cdi": {
            "cout_total": round(cout_total_cdi, 2),
            "marge_brute": round(marge_brute_cdi, 2),
            "marge_pourcent": round(marge_pourcent_cdi, 1)
        },
        "recommandation": meilleur_choix,
        "difference_marge": round(diff_marge, 2)
    }

    # --- OUTIL 6 : CALCULATEUR DE TACE ---
@app.post("/calcul-tace")
def calcul_tace(data: TACERequest):
    # 1. Calcul de la base disponible (Ce qu'on peut théoriquement facturer)
    jours_disponibles = data.jours_ouvres - data.jours_conges_feries
    
    # 2. Calcul des jours perdus (Non facturables)
    jours_perdus = data.jours_intercontrat + data.jours_formation
    
    # 3. Calcul des jours réellement facturés
    jours_factures = jours_disponibles - jours_perdus
    
    # Sécurité pour éviter les divisions par zéro ou les jours négatifs
    if jours_disponibles <= 0 or jours_factures < 0:
        raise HTTPException(
            status_code=400, 
            detail="Incohérence dans les jours. Vérifiez vos saisies."
        )

    # 4. Calcul du TACE (%)
    tace_percent = (jours_factures / jours_disponibles) * 100

    # 5. Impact Financier
    ca_realise = jours_factures * data.tjm
    ca_potentiel_max = jours_disponibles * data.tjm
    manque_a_gagner = ca_potentiel_max - ca_realise

    return {
        "jours_disponibles": jours_disponibles,
        "jours_factures": jours_factures,
        "tace_percent": round(tace_percent, 1),
        "ca_realise": round(ca_realise, 2),
        "ca_potentiel_max": round(ca_potentiel_max, 2),
        "manque_a_gagner": round(manque_a_gagner, 2)
    }

    # --- OUTIL 7 : SIMULATEUR SPLIT CONTRACT (MAROC UNIQUEMENT) ---
# --- OUTIL 7 : DÉCLARATION PARTIELLE (MAROC UNIQUEMENT) ---
@app.post("/calcul-split-contract")
def calcul_split_contract(data: SplitContractRequest):
    # Grille enrichie : Net -> { Total Entreprise, IR, Charges Sociales (CNSS+AMO) }
    # Calcul des charges = Total - Net - IR
    grille_maroc = {
        6000: {"total": 7110.28, "ir": 0.0, "charges": 1110.28},
        7000: {"total": 8409.58, "ir": 0.0, "charges": 1409.58},
        8000: {"total": 9718.05, "ir": 25.89, "charges": 1692.16},
        9000: {"total": 11042.07, "ir": 180.01, "charges": 1862.06},
        10000: {"total": 12389.63, "ir": 354.87, "charges": 2034.76},
        12000: {"total": 15236.10, "ir": 836.36, "charges": 2399.74},
        14000: {"total": 18584.83, "ir": 1756.86, "charges": 2827.97},
        20000: {"total": 29271.15, "ir": 5070.77, "charges": 4199.38}
    }

    if data.net_declare not in grille_maroc:
        raise HTTPException(
            status_code=400, 
            detail="Le salaire net sélectionné n'existe pas dans la grille marocaine."
        )

    budget_mensuel_total = data.cjm * 21
    donnees_paie = grille_maroc[data.net_declare]
    
    cout_cdi = donnees_paie["total"]
    restant_b2b = budget_mensuel_total - cout_cdi

    if restant_b2b < 0:
        raise HTTPException(
            status_code=400, 
            detail="Le CJM est trop faible pour couvrir ce salaire."
        )

    return {
        "cjm": data.cjm,
        "budget_mensuel_total": round(budget_mensuel_total, 2),
        "net_declare": data.net_declare,
        "cout_cdi": cout_cdi,
        "restant_b2b": round(restant_b2b, 2),
        # Nouveaux champs pour le détail consultant
        "detail_ir": donnees_paie["ir"],
        "detail_charges": round(donnees_paie["charges"], 2)
    }


# --- CV & IA : extraction PDF → structuration → Word ---
@app.post("/extract-cv")
async def extract_cv(
    file: UploadFile = File(..., description="CV au format PDF"),
    fiche_poste: str = Form("", description="Fiche de poste optionnelle pour orienter le CV"),
):
    """
    Lit le PDF, extrait le texte, appelle l'IA pour structurer le profil, génère le document Word.
    """
    filename = (file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés.",
        )

    uid = str(uuid.uuid4())
    upload_path = TEMP_UPLOADS / f"{uid}.pdf"
    output_path = TEMP_OUTPUTS / f"{uid}.docx"

    try:
        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=400, detail="Fichier PDF vide.")
        upload_path.write_bytes(raw)
    except HTTPException:
        raise
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Impossible d'enregistrer le fichier temporaire : {e}",
        ) from e

    texte = extraire_texte_pdf(str(upload_path))
    upload_path.unlink(missing_ok=True)

    if not texte.strip():
        raise HTTPException(
            status_code=400,
            detail="Impossible d'extraire du texte du PDF (fichier illisible ou corrompu).",
        )

    if not TEMPLATE_CV_PATH.is_file():
        raise HTTPException(
            status_code=500,
            detail="Modèle Word introuvable sur le serveur (templates/template_maltem.docx).",
        )

    try:
        from llm_service import extraire_cv

        profil = extraire_cv(texte, fiche_poste if fiche_poste.strip() else None)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Erreur lors de l'appel à l'IA : {e}",
        ) from e

    try:
        generer_word(profil, str(TEMPLATE_CV_PATH), str(output_path))
    except Exception as e:
        output_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"Génération du document Word impossible : {e}",
        ) from e

    base_name = (profil.nom_complet or "candidat").strip() or "candidat"
    safe = "".join(
        c if c.isalnum() or c in (" ", "-", "_") else "_" for c in base_name
    ).strip()[:80] or "candidat"
    download_name = f"Profil_Maltem_{safe.replace(' ', '_')}.docx"

    return FileResponse(
        path=str(output_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=download_name,
        background=BackgroundTask(lambda p=output_path: p.unlink(missing_ok=True)),
    )


# --- CV & IA : scoring multi-CV vs fiche de poste ---
@app.post("/score-cvs")
async def score_cvs(
    fiche_poste: str = Form(..., description="Texte de la fiche de poste / besoin"),
    files: list[UploadFile] = File(..., description="Un ou plusieurs CV au format PDF"),
):
    """
    Pour chaque PDF : extraction du texte, appel IA de scoring, retour JSON (liste ordonnée côté client).
    """
    if not fiche_poste.strip():
        raise HTTPException(
            status_code=400,
            detail="Collez une fiche de poste avant de lancer le scoring.",
        )
    if not files:
        raise HTTPException(
            status_code=400,
            detail="Ajoutez au moins un CV au format PDF.",
        )

    try:
        from llm_service import scorer_cv
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service IA indisponible : {e}",
        ) from e

    results: list[dict] = []

    for upload in files:
        name = (upload.filename or "").lower()
        if not name.endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"Fichier non-PDF ou invalide : {upload.filename!r}",
            )

        uid = str(uuid.uuid4())
        path = TEMP_UPLOADS / f"{uid}.pdf"

        try:
            data = await upload.read()
            if not data:
                raise HTTPException(
                    status_code=400,
                    detail=f"PDF vide : {upload.filename!r}",
                )
            path.write_bytes(data)
        except HTTPException:
            raise
        except OSError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Écriture temporaire impossible ({upload.filename}) : {e}",
            ) from e

        texte = extraire_texte_pdf(str(path))
        path.unlink(missing_ok=True)

        if not texte.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Impossible d'extraire du texte du CV : {upload.filename!r}",
            )

        try:
            score = scorer_cv(texte, fiche_poste)
            results.append(score.model_dump())
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Erreur IA pour {upload.filename!r} : {e}",
            ) from e

    return results