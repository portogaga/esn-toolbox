from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase_client import supabase
from services.email_service import send_weekly_kpi, send_email_batch

router = APIRouter(prefix="/sprint-rh", tags=["Sprint RH"])

# --- Models ---
class SemaineCreate(BaseModel):
    numero: int
    annee: int
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None

class BesoinCreate(BaseModel):
    semaine_id: str
    poste: str
    client: str
    biz_owner: str
    priorite: str
    deadline: Optional[str] = None

class BesoinUpdate(BaseModel):
    statut: Optional[str] = None
    priorite: Optional[str] = None
    biz_owner: Optional[str] = None

class ProfilCreate(BaseModel):
    besoin_id: str
    recruteur: str
    candidat: str
    statut_validation: Optional[str] = "attente_biz"

class ProfilUpdate(BaseModel):
    feedback_biz: Optional[str] = None
    commentaire: Optional[str] = None
    statut_validation: Optional[str] = None
    business_status: Optional[str] = None

class DailyLogCreate(BaseModel):
    semaine_id: str
    type: str
    recruteur: Optional[str] = None
    besoin_id: Optional[str] = None
    candidat: Optional[str] = None
    action: Optional[str] = None

class CompteCreate(BaseModel):
    semaine_id: str
    commercial: str
    compte: str

class CompteUpdate(BaseModel):
    nb_rdv: Optional[int] = None
    dates_rdv: Optional[str] = None
    statut: Optional[str] = None

class KickoffCreate(BaseModel):
    semaine_id: str
    consultant: str
    date_demarrage: Optional[str] = None
    client: str
    recruteur: Optional[str] = None

class EmailSettingUpsert(BaseModel):
    mail_type: str
    recipients: List[str]
    enabled: bool
    send_day: str
    send_hour: int

class CollaborateurCreate(BaseModel):
    nom: str
    role: str
    actif: bool = True

class CollaborateurUpdate(BaseModel):
    nom: Optional[str] = None
    role: Optional[str] = None
    actif: Optional[bool] = None

# --- Semaines ---
@router.get("/semaines")
def get_semaines():
    res = supabase.table("semaines").select("*").order("annee", desc=True).order("numero", desc=True).execute()
    return res.data

@router.post("/semaines")
def create_semaine(semaine: SemaineCreate):
    if not semaine.date_debut or not semaine.date_fin:
        raise HTTPException(status_code=400, detail="Les dates de debut et de fin sont obligatoires.")

    exist = supabase.table("semaines").select("id").eq("numero", semaine.numero).eq("annee", semaine.annee).execute()
    if exist.data:
        raise HTTPException(status_code=400, detail="Semaine déjà existante")

    previous = (
        supabase.table("semaines")
        .select("id, numero, annee")
        .order("annee", desc=True)
        .order("numero", desc=True)
        .limit(1)
        .execute()
    )
    previous_semaine = previous.data[0] if previous.data else None

    payload = semaine.dict()
    # Postgres date columns cannot accept empty strings.
    if payload.get("date_debut") == "":
        payload["date_debut"] = None
    if payload.get("date_fin") == "":
        payload["date_fin"] = None

    res = supabase.table("semaines").insert(payload).execute()
    if not res.data:
        return []

    new_semaine = res.data[0]

    # Auto-carryover depuis la semaine précédente:
    # - besoins non clos
    # - profils déjà envoyés client mais sans feedback
    if previous_semaine and previous_semaine.get("id") != new_semaine.get("id"):
        old_besoins_res = (
            supabase.table("besoins")
            .select("*")
            .eq("semaine_id", previous_semaine["id"])
            .execute()
        )
        old_besoins = old_besoins_res.data or []
        unresolved_besoins = [b for b in old_besoins if b.get("statut") != "clos"]

        old_to_new_besoin_id: Dict[str, str] = {}
        for old_besoin in unresolved_besoins:
            clone_payload = {
                "semaine_id": new_semaine["id"],
                "poste": old_besoin.get("poste"),
                "client": old_besoin.get("client"),
                "biz_owner": old_besoin.get("biz_owner"),
                "priorite": old_besoin.get("priorite") or "P1",
                "statut": "en_cours",
            }
            created = supabase.table("besoins").insert(clone_payload).execute()
            if created.data:
                old_to_new_besoin_id[old_besoin["id"]] = created.data[0]["id"]

        if old_to_new_besoin_id:
            old_ids = list(old_to_new_besoin_id.keys())
            old_profils_res = (
                supabase.table("profils_envoyes")
                .select("*")
                .in_("besoin_id", old_ids)
                .eq("statut_validation", "envoye_client")
                .eq("feedback_biz", "en_attente")
                .execute()
            )
            old_profils = old_profils_res.data or []
            for old_profil in old_profils:
                new_besoin_id = old_to_new_besoin_id.get(old_profil.get("besoin_id"))
                if not new_besoin_id:
                    continue
                clone_profil_payload = {
                    "besoin_id": new_besoin_id,
                    "recruteur": old_profil.get("recruteur"),
                    "candidat": old_profil.get("candidat"),
                    "statut_validation": "envoye_client",
                    "feedback_biz": "en_attente",
                    "commentaire": old_profil.get("commentaire"),
                }
                supabase.table("profils_envoyes").insert(clone_profil_payload).execute()

    return res.data

# --- Besoins ---
@router.get("/besoins")
def get_besoins(semaine_id: str):
    res = supabase.table("besoins").select("*").eq("semaine_id", semaine_id).execute()
    return res.data

@router.get("/besoins/en-cours")
def get_besoins_en_cours(semaine_id: str):
    res = supabase.table("besoins").select("*").eq("semaine_id", semaine_id).execute()
    return [b for b in res.data if b.get("statut") not in ["clos", "reporte"]]

@router.post("/besoins")
def create_besoin(besoin: BesoinCreate):
    res = supabase.table("besoins").insert(besoin.dict(exclude_unset=True)).execute()
    return res.data

@router.patch("/besoins/{id}")
def update_besoin(id: str, besoin: BesoinUpdate):
    data = besoin.dict(exclude_unset=True)
    if data.get("statut") in ["reporte", "reposte"]:
        # Compat UI legacy: "reporte/reposte" = besoin relance => "en_cours"
        data["statut"] = "en_cours"
    if not data: return {"status": "no update"}
    res = supabase.table("besoins").update(data).eq("id", id).execute()
    return res.data

# --- Profils ---
@router.get("/profils")
def get_profils(semaine_id: str):
    besoins = supabase.table("besoins").select("id").eq("semaine_id", semaine_id).execute()
    besoin_ids = [b["id"] for b in besoins.data]
    if not besoin_ids: return []
    res = supabase.table("profils_envoyes").select("*, besoins(poste, client)").in_("besoin_id", besoin_ids).execute()
    return res.data

@router.get("/profils/sans-feedback")
def get_profils_sans_feedback():
    res = supabase.table("profils_envoyes").select("*, besoins(poste, client, biz_owner)").eq("feedback_biz", "en_attente").eq("statut_validation", "envoye_client").order("date_envoi").execute()
    return res.data

@router.post("/profils")
def create_profil(profil: ProfilCreate):
    res = supabase.table("profils_envoyes").insert(profil.dict(exclude_unset=True)).execute()
    return res.data

@router.patch("/profils/{id}")
def update_profil(id: str, profil: ProfilUpdate):
    data = profil.dict(exclude_unset=True)
    business_status = data.pop("business_status", None)

    if business_status:
        normalized = business_status.strip().lower()
        if normalized == "envoye_client":
            data["statut_validation"] = "envoye_client"
            data["feedback_biz"] = "en_attente"
        elif normalized == "ko":
            data["statut_validation"] = "envoye_client"
            data["feedback_biz"] = "negatif"
        elif normalized == "hiring":
            data["statut_validation"] = "envoye_client"
            data["feedback_biz"] = "hiring"
        else:
            raise HTTPException(status_code=400, detail="business_status invalide")

    res = supabase.table("profils_envoyes").update(data).eq("id", id).execute()
    return res.data

@router.get("/profils/by-besoin/{besoin_id}")
def get_profils_by_besoin(besoin_id: str):
    res = supabase.table("profils_envoyes").select("*").eq("besoin_id", besoin_id).order("date_envoi", desc=True).execute()
    return res.data

# --- Daily Logs ---
@router.post("/daily")
def create_daily_log(log: DailyLogCreate):
    res = supabase.table("daily_logs").insert(log.dict(exclude_unset=True)).execute()
    return res.data

# --- Recap & KPIs ---
@router.get("/recap/{semaine_id}")
def get_recap(semaine_id: str):
    besoins = supabase.table("besoins").select("*").eq("semaine_id", semaine_id).execute()
    besoin_ids = [b["id"] for b in besoins.data]
    profils = []
    if besoin_ids:
        p_res = supabase.table("profils_envoyes").select("*").in_("besoin_id", besoin_ids).execute()
        profils = p_res.data
    comptes = supabase.table("comptes_prospection").select("*").eq("semaine_id", semaine_id).execute()
    kickoffs = supabase.table("kickoffs").select("*").eq("semaine_id", semaine_id).execute()
    logs = supabase.table("daily_logs").select("*").eq("semaine_id", semaine_id).execute()
    return {
        "besoins": besoins.data,
        "profils": profils,
        "comptes": comptes.data,
        "kickoffs": kickoffs.data,
        "daily_logs": logs.data
    }

@router.get("/kpis/{semaine_id}")
def get_kpis(semaine_id: str):
    besoins = supabase.table("besoins").select("*").eq("semaine_id", semaine_id).execute()
    besoin_ids = [b["id"] for b in besoins.data]
    profils = []
    if besoin_ids:
        p_res = supabase.table("profils_envoyes").select("*").in_("besoin_id", besoin_ids).execute()
        profils = p_res.data
        
    besoins_actifs = len([b for b in besoins.data if b.get("statut") not in ["clos", "bloque"]])
    hirings = len([p for p in profils if p.get("feedback_biz") == "hiring"])
    kos = len([p for p in profils if p.get("feedback_biz") == "negatif"])
    
    # KPIs distincts
    profils_sources = len(profils) # proposés par le recruteur
    profils_envoyes_client = len([p for p in profils if p.get("statut_validation") == "envoye_client"])
    
    par_recruteur = {}
    for p in profils:
        rec = p.get("recruteur", "Inconnu")
        if rec not in par_recruteur:
            par_recruteur[rec] = {"sourcés": 0, "envoyés_biz": 0, "hirings": 0, "ko": 0}
        par_recruteur[rec]["sourcés"] += 1
        if p.get("statut_validation") == "envoye_client":
            par_recruteur[rec]["envoyés_biz"] += 1
        if p.get("feedback_biz") == "hiring":
            par_recruteur[rec]["hirings"] += 1
        if p.get("feedback_biz") == "negatif":
            par_recruteur[rec]["ko"] += 1

    return {
        "global": {
            "besoins_actifs": besoins_actifs,
            "profils_sources_recrut": profils_sources,
            "profils_envoyes_biz": profils_envoyes_client,
            "hirings": hirings,
            "ko": kos,
        },
        "par_recruteur": par_recruteur
    }

# --- Comptes Prospection ---
@router.get("/comptes")
def get_comptes(semaine_id: str):
    res = supabase.table("comptes_prospection").select("*").eq("semaine_id", semaine_id).execute()
    return res.data
@router.post("/comptes")
def create_compte(compte: CompteCreate):
    res = supabase.table("comptes_prospection").insert(compte.dict(exclude_unset=True)).execute()
    return res.data
@router.patch("/comptes/{id}")
def update_compte(id: str, compte: CompteUpdate):
    res = supabase.table("comptes_prospection").update(compte.dict(exclude_unset=True)).eq("id", id).execute()
    return res.data

class BusinessRdvCreate(BaseModel):
    semaine_id: str
    commercial: str
    compte: str
    date_rdv: Optional[str] = None

@router.post("/business/rdv")
def add_business_rdv(payload: BusinessRdvCreate):
    existing = (
        supabase.table("comptes_prospection")
        .select("*")
        .eq("semaine_id", payload.semaine_id)
        .eq("commercial", payload.commercial)
        .eq("compte", payload.compte)
        .limit(1)
        .execute()
    )

    if existing.data:
        current = existing.data[0]
        nb = int(current.get("nb_rdv") or 0) + 1
        dates = current.get("dates_rdv") or ""
        new_date = payload.date_rdv or ""
        next_dates = dates
        if new_date:
            next_dates = f"{dates}, {new_date}".strip(", ") if dates else new_date
        updated = (
            supabase.table("comptes_prospection")
            .update({"nb_rdv": nb, "dates_rdv": next_dates})
            .eq("id", current["id"])
            .execute()
        )
        return updated.data

    created = (
        supabase.table("comptes_prospection")
        .insert(
            {
                "semaine_id": payload.semaine_id,
                "commercial": payload.commercial,
                "compte": payload.compte,
                "statut": "a_prospecter",
                "nb_rdv": 1,
                "dates_rdv": payload.date_rdv or None,
            }
        )
        .execute()
    )
    return created.data

# --- Kickoffs ---
@router.get("/kickoffs")
def get_kickoffs(semaine_id: str):
    res = supabase.table("kickoffs").select("*").eq("semaine_id", semaine_id).execute()
    return res.data
@router.post("/kickoffs")
def create_kickoff(kickoff: KickoffCreate):
    res = supabase.table("kickoffs").insert(kickoff.dict(exclude_unset=True)).execute()
    return res.data

# --- Email Settings ---
@router.get("/email-settings")
def get_email_settings():
    res = supabase.table("email_settings").select("*").execute()
    return res.data
@router.post("/email-settings")
def upsert_email_settings(setting: EmailSettingUpsert):
    res = supabase.table("email_settings").upsert(setting.dict(exclude_unset=True), on_conflict="mail_type").execute()
    return res.data

@router.post("/email/send")
def send_weekly_email(semaine_id: Optional[str] = Query(default=None)):
    target_semaine_id = semaine_id
    if not target_semaine_id:
        latest = (
            supabase.table("semaines")
            .select("id, numero")
            .order("annee", desc=True)
            .order("numero", desc=True)
            .limit(1)
            .execute()
        )
        if not latest.data:
            raise HTTPException(status_code=404, detail="Aucune semaine disponible")
        target_semaine_id = latest.data[0]["id"]
        semaine_numero = latest.data[0]["numero"]
    else:
        semaine_res = (
            supabase.table("semaines")
            .select("numero")
            .eq("id", target_semaine_id)
            .limit(1)
            .execute()
        )
        if not semaine_res.data:
            raise HTTPException(status_code=404, detail="Semaine introuvable")
        semaine_numero = semaine_res.data[0]["numero"]

    kpis = get_kpis(target_semaine_id)
    sent = send_weekly_kpi(semaine_numero, kpis.get("global", {}))
    return {"success": bool(sent), "semaine_id": target_semaine_id}

def _resolve_target_semaine(semaine_id: Optional[str]) -> Dict[str, Any]:
    if not semaine_id:
        latest = (
            supabase.table("semaines")
            .select("id, numero, annee, date_debut, date_fin")
            .order("annee", desc=True)
            .order("numero", desc=True)
            .limit(1)
            .execute()
        )
        if not latest.data:
            raise HTTPException(status_code=404, detail="Aucune semaine disponible")
        return latest.data[0]

    semaine_res = (
        supabase.table("semaines")
        .select("id, numero, annee, date_debut, date_fin")
        .eq("id", semaine_id)
        .limit(1)
        .execute()
    )
    if not semaine_res.data:
        raise HTTPException(status_code=404, detail="Semaine introuvable")
    return semaine_res.data[0]

def _resolve_recipients(mail_type: str) -> List[str]:
    settings = (
        supabase.table("email_settings")
        .select("recipients")
        .eq("mail_type", mail_type)
        .limit(1)
        .execute()
    )
    if settings.data and settings.data[0].get("recipients"):
        return settings.data[0]["recipients"]
    return ["rh@esn.com"]

@router.post("/email/send-week-start")
def send_week_start_email(semaine_id: Optional[str] = Query(default=None)):
    semaine = _resolve_target_semaine(semaine_id)
    recap = get_recap(semaine["id"])
    recipients = _resolve_recipients("sprint")

    besoins = recap.get("besoins", [])
    comptes = recap.get("comptes", [])
    kickoffs = recap.get("kickoffs", [])
    besoins_text = "".join(
        [f"<li><b>{b.get('poste')}</b> - {b.get('client')} ({b.get('priorite', 'P1')})</li>" for b in besoins[:8]]
    ) or "<li>Aucun besoin saisi pour le moment.</li>"

    subject = f"[Sprint RH] Debut de semaine - Sprint {semaine['numero']} ({semaine['annee']})"
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin-bottom:4px">Sprint RH - Lancement de semaine</h2>
      <p style="margin-top:0;color:#4b5563">Sprint {semaine['numero']} ({semaine['annee']}) - {semaine.get('date_debut')} au {semaine.get('date_fin')}</p>
      <h3>Plan de la semaine</h3>
      <ul>
        <li><b>{len(besoins)}</b> besoins ouverts</li>
        <li><b>{len(comptes)}</b> comptes en prospection</li>
        <li><b>{len(kickoffs)}</b> kickoffs planifies</li>
      </ul>
      <h3>Besoins prioritaires</h3>
      <ul>{besoins_text}</ul>
      <p style="margin-top:20px;color:#4b5563">Bonne semaine a toute l'equipe.</p>
    </div>
    """
    sent = send_email_batch(recipients, subject, html)
    return {"success": bool(sent), "semaine_id": semaine["id"], "recipients": recipients}

@router.post("/email/send-week-end")
def send_week_end_email(semaine_id: Optional[str] = Query(default=None)):
    semaine = _resolve_target_semaine(semaine_id)
    kpis = get_kpis(semaine["id"])
    recap = get_recap(semaine["id"])
    recipients = _resolve_recipients("weekly")

    profils = recap.get("profils", [])
    recruiter_stats: Dict[str, Dict[str, int]] = {}
    for profil in profils:
        recruiter = profil.get("recruteur", "Inconnu")
        if recruiter not in recruiter_stats:
            recruiter_stats[recruiter] = {"profils_envoyes_biz": 0, "entretiens": 0}
        recruiter_stats[recruiter]["profils_envoyes_biz"] += 1
        if profil.get("feedback_biz") in ["positif", "hiring"]:
            recruiter_stats[recruiter]["entretiens"] += 1

    recruiter_rows = "".join(
        [
            f"<tr><td style='padding:6px 8px;border-bottom:1px solid #e5e7eb'>{name}</td><td style='padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center'>{vals['profils_envoyes_biz']}</td><td style='padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center'>{vals['entretiens']}</td></tr>"
            for name, vals in recruiter_stats.items()
        ]
    ) or "<tr><td colspan='3' style='padding:6px 8px;color:#6b7280'>Aucune donnee recruteur</td></tr>"

    global_kpis = kpis.get("global", {})
    subject = f"[Sprint RH] Recap fin de semaine - Sprint {semaine['numero']} ({semaine['annee']})"
    html = f"""
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin-bottom:4px">Recap fin de semaine</h2>
      <p style="margin-top:0;color:#4b5563">Sprint {semaine['numero']} ({semaine['annee']})</p>
      <h3>KPIs globaux</h3>
      <ul>
        <li><b>{global_kpis.get('besoins_actifs', 0)}</b> besoins actifs</li>
        <li><b>{global_kpis.get('profils_sources_recrut', 0)}</b> profils sources (recrutement)</li>
        <li><b>{global_kpis.get('profils_envoyes_biz', 0)}</b> profils envoyes au client (Biz)</li>
        <li><b>{global_kpis.get('hirings', 0)}</b> hirings</li>
      </ul>
      <h3>Performance par recruteur</h3>
      <table style="border-collapse:collapse;width:100%;max-width:620px;background:#ffffff;border:1px solid #e5e7eb">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:6px 8px;text-align:left">Recruteur</th>
            <th style="padding:6px 8px;text-align:center">Profils envoyes au Biz</th>
            <th style="padding:6px 8px;text-align:center">Entretiens vus</th>
          </tr>
        </thead>
        <tbody>{recruiter_rows}</tbody>
      </table>
    </div>
    """
    sent = send_email_batch(recipients, subject, html)
    return {"success": bool(sent), "semaine_id": semaine["id"], "recipients": recipients}

# --- Collaborateurs ---
@router.get("/collaborateurs")
def get_collaborateurs():
    res = supabase.table("collaborateurs").select("*").order("nom").execute()
    return res.data
@router.post("/collaborateurs")
def create_collaborateur(collab: CollaborateurCreate):
    res = supabase.table("collaborateurs").insert(collab.dict(exclude_unset=True)).execute()
    return res.data
@router.patch("/collaborateurs/{id}")
def update_collaborateur(id: str, collab: CollaborateurUpdate):
    res = supabase.table("collaborateurs").update(collab.dict(exclude_unset=True)).eq("id", id).execute()
    return res.data
@router.delete("/collaborateurs/{id}")
def delete_collaborateur(id: str):
    res = supabase.table("collaborateurs").delete().eq("id", id).execute()
    return res.data

class ReportItemReq(BaseModel):
    item_type: str # "besoin", "compte"
    item_id: str
    next_semaine_id: str

@router.post("/weekly/report")
def report_item(req: ReportItemReq):
    if req.item_type == "besoin":
        # 1. Get original
        res = supabase.table("besoins").select("*").eq("id", req.item_id).execute()
        if not res.data: return {"error": "not found"}
        original = res.data[0]
        # 2. Mark original as closed (constraint-safe)
        supabase.table("besoins").update({"statut": "clos"}).eq("id", req.item_id).execute()
        # 3. Create clone
        clone = {
            "semaine_id": req.next_semaine_id,
            "poste": original.get("poste"),
            "client": original.get("client"),
            "biz_owner": original.get("biz_owner"),
            "priorite": original.get("priorite"),
            "statut": "nouveau"
        }
        supabase.table("besoins").insert(clone).execute()
        return {"status": "reported"}
        
    if req.item_type == "compte":
        res = supabase.table("comptes_prospection").select("*").eq("id", req.item_id).execute()
        if not res.data: return {"error": "not found"}
        original = res.data[0]
        supabase.table("comptes_prospection").update({"statut": "reporte"}).eq("id", req.item_id).execute()
        clone = {
            "semaine_id": req.next_semaine_id,
            "commercial": original.get("commercial"),
            "compte": original.get("compte"),
            "statut": "a_prospecter"
        }
        supabase.table("comptes_prospection").insert(clone).execute()
        return {"status": "reported"}
        
    return {"error": "invalid type"}
