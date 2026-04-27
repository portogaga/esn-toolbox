"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, RefreshCw, Check, Clock, CheckSquare } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function WeeklyReviewPage() {
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string | null>(null);
  const [nextSemaineId, setNextSemaineId] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchSemaines = async () => {
    try {
      const res = await fetch(apiUrl("/sprint-rh/semaines"));
      const data = await res.json();
      if (Array.isArray(data)) {
        setSemaines(data);
        if (data.length > 0) {
          setCurrentSemaineId(data[0].id);
          if (data.length > 1) setNextSemaineId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSemaines(); }, []);

  const loadData = async () => {
    if (!currentSemaineId) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/sprint-rh/recap/${currentSemaineId}`));
      setRecapData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentSemaineId]);

  const handleAction = async (type: string, id: string, action: "done" | "report") => {
    if (action === "report" && (!nextSemaineId || nextSemaineId === currentSemaineId)) {
      alert("Veuillez sélectionner un Sprint futur pour le report.");
      return;
    }

    const endpoint = action === "done" 
      ? apiUrl(`/sprint-rh/${type}s/${id}`)
      : apiUrl("/sprint-rh/weekly/report");

    const method = action === "done" ? "PATCH" : "POST";
    const body = action === "done" 
      ? { statut: "clos" }
      : { item_type: type.replace(/s$/, ""), item_id: id, next_semaine_id: nextSemaineId };

    await fetch(endpoint, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    setToast(action === "done" ? "Marqué comme terminé" : "Élément reporté");
    setTimeout(() => setToast(null), 2000);
    loadData();
  };

  if (loading && !recapData) {
    return <div className="py-20 flex justify-center text-sky-500"><RefreshCw className="animate-spin w-6 h-6"/></div>;
  }

  const besoinsActifs = (recapData?.besoins || []).filter((b:any) => !["clos", "reporte"].includes(b.statut));
  const besoinsDone = (recapData?.besoins || []).filter((b:any) => b.statut === "clos");
  const comptesActifs = (recapData?.comptes || []).filter((c:any) => !["clos", "reporte"].includes(c.statut));
  const comptesDone = (recapData?.comptes || []).filter((c:any) => c.statut === "clos");

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 text-white px-5 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 border border-zinc-700 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">Weekly Review</h1>
          <p className="mt-2 text-sm text-zinc-400">Clôture du sprint et préparation de la semaine suivante.</p>
        </div>
        
        <div className="flex gap-6 items-end">
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">Sprint Actuel</label>
            <select value={currentSemaineId || ""} onChange={(e) => setCurrentSemaineId(e.target.value)} className="rounded-xl border border-slate-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer">
              {semaines.map((s) => <option key={s.id} value={s.id} className="bg-zinc-900">Semaine {s.numero} ({s.annee})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider flex items-center gap-1"><ArrowRight className="w-3 h-3"/> Reporter vers</label>
            <select value={nextSemaineId || ""} onChange={(e) => setNextSemaineId(e.target.value)} className="rounded-xl border border-slate-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer">
              {semaines.map((s) => <option key={s.id} value={s.id} className="bg-zinc-900">Semaine {s.numero} ({s.annee})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Section Besoins */}
        <section className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-black/30">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 border-b border-slate-800/90 pb-4">
            <CheckSquare className="w-4 h-4 text-sky-400" /> Revue des Besoins ({besoinsActifs.length})
          </h2>
          
          <div className="space-y-3">
            {besoinsActifs.length === 0 ? (
              <p className="text-sm text-zinc-500">Tous les besoins ont été traités.</p>
            ) : (
              besoinsActifs.map((b: any) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-700/50 bg-zinc-950/40 p-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{b.poste}</p>
                    <p className="text-xs text-zinc-500 mt-1">{b.client} • {b.biz_owner}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction("besoin", b.id, "done")} className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100">
                      Done
                    </button>
                    <button onClick={() => handleAction("besoin", b.id, "report")} className="inline-flex items-center gap-1 justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100">
                      Reporter <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {besoinsDone.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">Clôturés cette semaine</h3>
              <ul className="space-y-3">
                {besoinsDone.map((b: any) => (
                  <li key={b.id} className="flex items-center gap-3 text-sm text-zinc-500 opacity-70">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="line-through decoration-zinc-700">{b.poste}</span>
                    <span className="text-xs">({b.client})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Section Prospection */}
        <section className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-black/30">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400 border-b border-slate-800/90 pb-4">
            <CheckSquare className="w-4 h-4 text-purple-400" /> Comptes Chassés ({comptesActifs.length})
          </h2>
          
          <div className="space-y-3">
            {comptesActifs.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun compte en attente.</p>
            ) : (
              comptesActifs.map((c: any) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-700/50 bg-zinc-950/40 p-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{c.compte}</p>
                    <p className="text-xs text-zinc-500 mt-1">{c.commercial} • {c.nb_rdv} RDV</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction("compte", c.id, "done")} className="inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100">
                      Done
                    </button>
                    <button onClick={() => handleAction("compte", c.id, "report")} className="inline-flex items-center gap-1 justify-center rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100">
                      Reporter <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {comptesDone.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-4">Clôturés cette semaine</h3>
              <ul className="space-y-3">
                {comptesDone.map((c: any) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm text-zinc-500 opacity-70">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="line-through decoration-zinc-700">{c.compte}</span>
                    <span className="text-xs">({c.commercial})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
