"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle2, ArrowRight, Save, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function SprintPlanningWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: Init, 1: Besoins, 2: Prospection, 3: Kickoff, 4: Feedback, 5: Closing
  const [currentSemaineId, setCurrentSemaineId] = useState<string | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);
  
  // Data lists for the current sprint
  const [besoins, setBesoins] = useState<any[]>([]);
  const [comptes, setComptes] = useState<any[]>([]);
  const [kickoffs, setKickoffs] = useState<any[]>([]);
  const [carryoverInfo, setCarryoverInfo] = useState<{ besoins: number; profilsSansFeedback: number } | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  
  // For closing / feedback, we'd theoretically need past data, but we can do it simply here.
  const [profils, setProfils] = useState<any[]>([]); // New profils

  // Sprint Creation State
  const currentWeekNum = Math.ceil(Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)) / 7);
  const [numero, setNumero] = useState(currentWeekNum.toString());
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const fetchData = async () => {
    try {
      const resCollab = await fetch(apiUrl("/sprint-rh/collaborateurs"));
      setCollaborateurs(await resCollab.json());
    } catch (err) {
      console.error(err);
      setPageError("Impossible de charger les collaborateurs. Verifie l'API Sprint RH.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const bizOwners = collaborateurs.filter(c => c.role === 'biz').map(c => c.nom);
  const recruteurs = collaborateurs.filter(c => c.role === 'recruteur').map(c => c.nom);

  const startSprint = async () => {
    setPageError(null);
    if (!dateDebut || !dateFin) {
      setPageError("Renseigne la date de debut et la date de fin du sprint.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/sprint-rh/semaines"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: parseInt(numero),
          annee: parseInt(annee),
          date_debut: dateDebut || null,
          date_fin: dateFin || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Backend may return either an inserted row array or a single object.
        const newSemaineId = Array.isArray(data) ? data[0]?.id : data?.id;
        if (!newSemaineId) {
          setPageError("Sprint cree, mais impossible de recuperer son identifiant.");
          return;
        }
        setCurrentSemaineId(newSemaineId);

        // Charge les données auto-reprises (si la semaine précédente avait des éléments non résolus)
        const [besRes, comRes, kickRes, recapRes] = await Promise.all([
          fetch(apiUrl(`/sprint-rh/besoins?semaine_id=${newSemaineId}`)),
          fetch(apiUrl(`/sprint-rh/comptes?semaine_id=${newSemaineId}`)),
          fetch(apiUrl(`/sprint-rh/kickoffs?semaine_id=${newSemaineId}`)),
          fetch(apiUrl(`/sprint-rh/recap/${newSemaineId}`)),
        ]);
        const [besData, comData, kickData, recapData] = await Promise.all([
          besRes.json(),
          comRes.json(),
          kickRes.json(),
          recapRes.json(),
        ]);
        setBesoins(Array.isArray(besData) ? besData : []);
        setComptes(Array.isArray(comData) ? comData : []);
        setKickoffs(Array.isArray(kickData) ? kickData : []);
        const profilsSansFeedback =
          (recapData?.profils || []).filter(
            (p: any) => p?.statut_validation === "envoye_client" && p?.feedback_biz === "en_attente"
          ).length || 0;
        const besoinsCount = Array.isArray(besData) ? besData.length : 0;
        if (besoinsCount > 0 || profilsSansFeedback > 0) {
          setCarryoverInfo({ besoins: besoinsCount, profilsSansFeedback });
        } else {
          setCarryoverInfo(null);
        }
        setStep(1); // Move to Besoins
      } else {
        let detail = "";
        try {
          const errorData = await res.json();
          detail = errorData?.detail || "";
        } catch {
          detail = await res.text();
        }
        setPageError(detail || "Erreur creation sprint: semaine deja existante ou API indisponible.");
      }
    } catch (err: any) {
      console.error(err);
      setPageError(err?.message ? `Erreur reseau: ${err.message}` : "Erreur reseau pendant la creation du sprint.");
    }
  };

  const finishSprintPlanning = () => {
    // Navigate to dashboard
    router.push("/sprint-rh/dashboard");
  };

  const renderStep0 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30 max-w-xl mx-auto mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-6 text-center">Créer un Nouveau Sprint</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Numéro *</label>
            <input type="number" value={numero} onChange={e => setNumero(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Année *</label>
            <input type="number" value={annee} onChange={e => setAnnee(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Date de début *</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Date de fin *</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        </div>
        <button onClick={startSprint} className="w-full mt-4 border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          Commencer le Planning <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- Step 1: Besoins ---
  const [bPoste, setBPoste] = useState("");
  const [bClient, setBClient] = useState("");
  const [bBizOwner, setBBizOwner] = useState("");
  const [bPriorite, setBPriorite] = useState("P1");

  const addBesoin = async () => {
    if (!bPoste || !bClient || !bBizOwner) return;
    try {
      const payload = { semaine_id: currentSemaineId, poste: bPoste, client: bClient, biz_owner: bBizOwner, priorite: bPriorite };
      const res = await fetch(apiUrl("/sprint-rh/besoins"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setBesoins([...besoins, data[0]]);
        setBPoste(""); setBClient(""); setBBizOwner("");
      }
    } catch (e) { console.error(e); }
  };

  const renderStep1 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30">
      {carryoverInfo && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Reprise automatique effectuée : <b>{carryoverInfo.besoins}</b> besoin(s) et{" "}
          <b>{carryoverInfo.profilsSansFeedback}</b> profil(s) sans feedback importés depuis la semaine précédente.
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Étape 1 : Besoins de la semaine</h2>
        <span className="text-emerald-400 font-bold">{besoins.length} ajoutés</span>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        <input placeholder="Poste" value={bPoste} onChange={e => setBPoste(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        <input placeholder="Client" value={bClient} onChange={e => setBClient(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        <select value={bBizOwner} onChange={e => setBBizOwner(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
          <option value="">Biz Owner</option>
          {bizOwners.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="flex gap-2">
          <select value={bPriorite} onChange={e => setBPriorite(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white flex-1">
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
          </select>
          <button onClick={addBesoin} className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 p-2 rounded"><Plus /></button>
        </div>
      </div>

      <ul className="space-y-2 mb-8">
        {besoins.map((b, i) => (
          <li key={i} className="flex justify-between bg-zinc-950/60 p-3 rounded border border-slate-800/90 text-sm">
            <span>{b.poste} - {b.client}</span>
            <div className="flex gap-4 text-zinc-400">
              <span>{b.biz_owner}</span>
              <span className="text-emerald-400">{b.priorite}</span>
            </div>
          </li>
        ))}
      </ul>

      <button onClick={() => setStep(2)} className="w-full border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
        Valider et passer à Prospection <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  // --- Step 2: Prospection ---
  const [cCommercial, setCCommercial] = useState("");
  const [cCompte, setCCompte] = useState("");

  const addCompte = async () => {
    if (!cCommercial || !cCompte) return;
    try {
      const payload = { semaine_id: currentSemaineId, commercial: cCommercial, compte: cCompte, statut: "a_prospecter" };
      const res = await fetch(apiUrl("/sprint-rh/comptes"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setComptes([...comptes, data[0]]);
        setCCompte("");
      }
    } catch (e) { console.error(e); }
  };

  const renderStep2 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Étape 2 : Prospection</h2>
        <span className="text-emerald-400 font-bold">{comptes.length} comptes</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <select value={cCommercial} onChange={e => setCCommercial(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
          <option value="">Commercial</option>
          {bizOwners.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input placeholder="Nom du Compte" value={cCompte} onChange={e => setCCompte(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        <button onClick={addCompte} className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 p-2 rounded w-12"><Plus /></button>
      </div>

      <ul className="space-y-2 mb-8">
        {comptes.map((c, i) => (
          <li key={i} className="flex justify-between bg-zinc-950/60 p-3 rounded border border-slate-800/90 text-sm">
            <span>{c.compte}</span>
            <span className="text-zinc-400">{c.commercial}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
        <button onClick={() => setStep(1)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-bold">Retour</button>
        <button onClick={() => setStep(3)} className="flex-1 border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          Valider et passer aux Kickoffs <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- Step 3: Kickoffs ---
  const [kConsultant, setKConsultant] = useState("");
  const [kClient, setKClient] = useState("");

  const addKickoff = async () => {
    if (!kConsultant || !kClient) return;
    try {
      const payload = { semaine_id: currentSemaineId, consultant: kConsultant, client: kClient };
      const res = await fetch(apiUrl("/sprint-rh/kickoffs"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const data = await res.json();
        setKickoffs([...kickoffs, data[0]]);
        setKConsultant(""); setKClient("");
      }
    } catch (e) { console.error(e); }
  };

  const renderStep3 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Étape 3 : Kickoffs</h2>
        <span className="text-emerald-400 font-bold">{kickoffs.length} prévus</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input placeholder="Consultant" value={kConsultant} onChange={e => setKConsultant(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        <input placeholder="Client" value={kClient} onChange={e => setKClient(e.target.value)} className="bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
        <button onClick={addKickoff} className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 p-2 rounded w-12"><Plus /></button>
      </div>

      <ul className="space-y-2 mb-8">
        {kickoffs.map((k, i) => (
          <li key={i} className="flex justify-between bg-zinc-950/60 p-3 rounded border border-slate-800/90 text-sm">
            <span>{k.consultant}</span>
            <span className="text-zinc-400">{k.client}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
        <button onClick={() => setStep(2)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-bold">Retour</button>
        <button onClick={() => setStep(4)} className="flex-1 border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          Passer aux Feedbacks <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- Step 4 & 5 placeholders for flow ---
  const renderStep4 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30 text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Étape 4 : Feedback</h2>
      <p className="text-zinc-400 mb-8">Ici vous listerez les profils en attente de retour. (En général cela se fait via le Daily, ou via la sélection de profils passés).</p>
      <div className="flex gap-4">
        <button onClick={() => setStep(3)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-bold">Retour</button>
        <button onClick={() => setStep(5)} className="flex-1 border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-3 rounded-lg font-bold">Passer au Closing</button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30 text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Étape 5 : Closing</h2>
      <p className="text-zinc-400 mb-8">Prévisions de closing pour la semaine.</p>
      <div className="flex gap-4">
        <button onClick={() => setStep(4)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg font-bold">Retour</button>
        <button onClick={finishSprintPlanning} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Clôturer le Planning et aller au Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {pageError && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {pageError}
        </div>
      )}
      {/* Stepper Header */}
      {step > 0 && (
        <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-3xl shadow-2xl shadow-black/30 border border-slate-800/90 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-zinc-800'}`}>
                {s}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {s === 1 && "Besoins"}
                {s === 2 && "Prospection"}
                {s === 3 && "Kickoff"}
                {s === 4 && "Feedback"}
                {s === 5 && "Closing"}
              </span>
            </div>
          ))}
        </div>
      )}

      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
    </div>
  );
}
