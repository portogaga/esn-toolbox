"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Play, CheckSquare, Square, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import ModalBesoin from "../components/modals/ModalBesoin";
import ModalProfil from "../components/modals/ModalProfil";
import ModalClosing from "../components/modals/ModalClosing";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function DailyPage() {
  const router = useRouter();
  const [isDailyActive, setIsDailyActive] = useState(false);
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<any>(null);
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const resCollab = await fetch(apiUrl("/sprint-rh/collaborateurs"));
      setCollaborateurs(await resCollab.json());
      const resSemaines = await fetch(apiUrl("/sprint-rh/semaines"));
      const dataSemaines = await resSemaines.json();
      setSemaines(dataSemaines);
      if (dataSemaines.length > 0 && !currentSemaineId) {
        setCurrentSemaineId(dataSemaines[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadSprintData = async () => {
    if (!currentSemaineId) return;
    try {
      const res = await fetch(apiUrl(`/sprint-rh/recap/${currentSemaineId}`));
      setRecapData(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadSprintData(); }, [currentSemaineId]);

  const handleSuccess = () => {
    setActiveModal(null);
    setToast("Ajouté avec succès");
    setTimeout(() => setToast(null), 3000);
    loadSprintData();
  };

  const toggleBesoinStatus = async (b: any) => {
    const newStatut = b.statut === "clos" ? "nouveau" : "clos";
    try {
      await fetch(apiUrl(`/sprint-rh/besoins/${b.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut })
      });
      loadSprintData();
    } catch (e) {}
  };

  const toggleValidationBiz = async (p: any) => {
    // Si c'est attente_biz, on passe à envoye_client (Biz valide le CV)
    const newVal = p.statut_validation === "attente_biz" ? "envoye_client" : "attente_biz";
    try {
      await fetch(apiUrl(`/sprint-rh/profils/${p.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut_validation: newVal })
      });
      loadSprintData();
    } catch (e) {}
  };

  if (!isDailyActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-white mb-6">Réunion Daily</h1>
        <p className="text-zinc-400 mb-8 max-w-md text-center">Lancez le mode Daily pour rendre le Dashboard interactif, cocher les accomplissements et ajouter de nouveaux éléments à la volée.</p>
        <button 
          onClick={() => setIsDailyActive(true)}
          className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-8 py-4 rounded-3xl shadow-2xl shadow-black/30 font-bold text-lg flex items-center gap-3 shadow-lg transition hover:scale-105"
        >
          <Play className="w-6 h-6" /> Commencer le Daily
        </button>
      </div>
    );
  }

  const bizOwners = collaborateurs.filter(c => c.role === 'biz').map(c => c.nom);
  const clients = Array.from(new Set((recapData?.besoins || []).map((b: any) => b.client)));

  const besoinsRaw = recapData?.besoins || [];
  const profilsRaw = recapData?.profils || [];

  // Groupings
  const besoinsActifs = besoinsRaw.filter((b: any) => b.statut !== "clos");
  const besoinsByClient = besoinsActifs.reduce((acc: any, b: any) => {
    acc[b.client] = acc[b.client] || [];
    acc[b.client].push(b);
    return acc;
  }, {});

  // Profils en attente de validation Biz
  const profilsAttenteBiz = profilsRaw.filter((p: any) => p.statut_validation === "attente_biz");
  
  // Profils envoyés client (en attente feedback)
  const feedbackByClient = profilsRaw.filter((p: any) => p.statut_validation === "envoye_client" && p.feedback_biz !== "hiring").reduce((acc: any, p: any) => {
    const b = besoinsRaw.find((b: any) => b.id === p.besoin_id);
    const client = b ? b.client : "Inconnu";
    acc[client] = acc[client] || [];
    acc[client].push({ ...p, poste: b ? b.poste : "Inconnu" });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {toast}
        </div>
      )}

      {/* Topbar Mode Daily */}
      <div className="bg-emerald-900/30 border border-emerald-500/50 p-4 rounded-3xl shadow-2xl shadow-black/30 flex justify-between items-center sticky top-4 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <h1 className="text-xl font-bold text-emerald-400">Mode Daily Actif</h1>
        </div>
        <button 
          onClick={() => { setIsDailyActive(false); router.push('/sprint-rh/dashboard'); }}
          className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-2 rounded font-bold shadow transition"
        >
          Finir le Daily
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section Besoins */}
        <section className="bg-slate-900/60 border border-slate-800/90 p-5 rounded-3xl shadow-2xl shadow-black/30">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800/90 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Besoins Actifs</h2>
            <button onClick={() => setActiveModal("besoin")} className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-white"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            {Object.keys(besoinsByClient).map((client) => (
              <div key={client}>
                <h3 className="text-sm font-bold text-zinc-500 mb-2">{client}</h3>
                <ul className="space-y-2">
                  {besoinsByClient[client].map((b: any) => (
                    <li key={b.id} className="flex items-center gap-3 bg-zinc-950/60 p-2 rounded border border-slate-800/90">
                      <button onClick={() => toggleBesoinStatus(b)} className="text-zinc-500 hover:text-emerald-400">
                        {b.statut === "clos" ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5" />}
                      </button>
                      <span className="text-sm text-zinc-300">{b.poste}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section Validation Biz */}
        <section className="bg-slate-900/60 border border-amber-900/50 p-5 rounded-3xl shadow-2xl shadow-black/30">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800/90 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">À Valider (Biz)</h2>
            <button onClick={() => setActiveModal("profil")} className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-white"><Plus className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Profils sourcés par les recruteurs en attente d'envoi client.</p>
          <ul className="space-y-2">
            {profilsAttenteBiz.map((p: any) => {
               const b = besoinsRaw.find((b: any) => b.id === p.besoin_id);
               return (
                <li key={p.id} className="flex items-center gap-3 bg-zinc-950/60 p-2 rounded border border-slate-800/90">
                  <button onClick={() => toggleValidationBiz(p)} className="text-zinc-500 hover:text-emerald-400" title="Valider l'envoi au client">
                    <Square className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-zinc-300">{p.candidat} — <span className="text-zinc-500">{b?.poste} ({b?.client})</span></span>
                </li>
               )
            })}
            {profilsAttenteBiz.length === 0 && <p className="text-sm text-zinc-600">Rien à valider.</p>}
          </ul>
        </section>

        {/* Section Feedback */}
        <section className="bg-slate-900/60 border border-slate-800/90 p-5 rounded-3xl shadow-2xl shadow-black/30">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800/90 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Feedback Attendu</h2>
            <button onClick={() => setActiveModal("closing")} className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-white text-xs">Closer un profil</button>
          </div>
          <div className="space-y-4">
            {Object.keys(feedbackByClient).map((client) => (
              <div key={client}>
                <h3 className="text-sm font-bold text-zinc-500 mb-2">{client}</h3>
                <ul className="space-y-2">
                  {feedbackByClient[client].map((p: any) => (
                    <li key={p.id} className="flex items-center justify-between bg-zinc-950/60 p-2 rounded border border-slate-800/90 text-sm">
                      <span className="text-zinc-300">{p.candidat} — {p.poste}</span>
                      <span className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded">Envoyé Client</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

      </div>

      <ModalBesoin isOpen={activeModal === "besoin"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} currentSemaineId={currentSemaineId} existingClients={clients} existingBizOwners={bizOwners} />
      <ModalProfil isOpen={activeModal === "profil"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} currentSemaineId={currentSemaineId} besoins={besoinsRaw} />
      <ModalClosing isOpen={activeModal === "closing"} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} currentSemaineId={currentSemaineId} profils={profilsRaw.filter((p:any) => p.statut_validation === "envoye_client")} />
    </div>
  );
}
