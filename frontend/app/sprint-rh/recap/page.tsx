"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Copy, CalendarClock, CalendarCheck2, Send } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function RecapPage() {
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingType, setSendingType] = useState<"start" | "end" | null>(null);

  const fetchSemaines = async () => {
    try {
      const res = await fetch(apiUrl("/sprint-rh/semaines"));
      const data = await res.json();
      if (Array.isArray(data)) {
        setSemaines(data);
        if (data.length > 0 && !currentSemaineId) setCurrentSemaineId(data[0].id);
        else if (data.length === 0) setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchSemaines(); }, []);

  useEffect(() => {
    if (!currentSemaineId) return;
    setLoading(true);
    Promise.all([
      fetch(apiUrl(`/sprint-rh/recap/${currentSemaineId}`)).then(r => r.json()),
      fetch(apiUrl(`/sprint-rh/kpis/${currentSemaineId}`)).then(r => r.json()),
    ]).then(([recap, kpis]) => {
      setRecapData(recap);
      setKpiData(kpis);
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentSemaineId]);

  const handleCopy = () => {
    const text = document.getElementById("recap-content")?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      setToast("Copié dans le presse-papier !");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSendEmail = async (type: "start" | "end") => {
    try {
      setSendingType(type);
      const query = currentSemaineId ? `?semaine_id=${currentSemaineId}` : "";
      const endpoint =
        type === "start"
          ? apiUrl(`/sprint-rh/email/send-week-start${query}`)
          : apiUrl(`/sprint-rh/email/send-week-end${query}`);
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setToast(type === "start" ? "Récap début de semaine envoyé !" : "Récap fin de semaine envoyé !");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingType(null);
    }
  };

  if (loading && !recapData) {
    return <div className="p-8 text-center text-zinc-400"><RefreshCw className="animate-spin inline-block mr-2"/> Chargement...</div>;
  }

  if (!semaines.length) {
    return <div className="p-8 text-center text-zinc-400">Aucune semaine créée.</div>;
  }

  const currentSemaine = semaines.find(s => s.id === currentSemaineId);

  // Stats textuelles
  const besoinsClos = (recapData?.besoins || []).filter((b:any) => b.statut === "clos");
  const profilsHiring = (recapData?.profils || []).filter((p:any) => p.feedback_biz === "hiring");
  const profilsEnvoyes = (recapData?.profils || []).filter((p:any) => p.statut_validation === "envoye_client");

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-black/95 p-6 sm:p-8 shadow-2xl shadow-black/35">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Communication email</p>
            <h1 className="text-3xl font-bold text-white mt-2">Récaps Sprint RH</h1>
            <p className="text-zinc-400 mt-1">Envoie les mails “début de semaine” et “fin de semaine” en un clic.</p>
        </div>
        <select
          value={currentSemaineId || ""}
          onChange={(e) => setCurrentSemaineId(e.target.value)}
            className="bg-zinc-950/90 border border-zinc-700 text-white rounded-xl px-3 py-2"
        >
          {semaines.map((s) => (
            <option key={s.id} value={s.id}>
              Semaine {s.numero} - {s.annee}
            </option>
          ))}
        </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <button
          onClick={() => handleSendEmail("end")}
          disabled={sendingType !== null}
          className="rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300/60 disabled:opacity-60"
        >
          <div className="flex items-center gap-2 text-emerald-300">
            <CalendarCheck2 className="w-5 h-5" />
            <p className="font-semibold">Récap fin de semaine</p>
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            Envoie les KPIs globaux + performance par recruteur (profils envoyés au Biz et entretiens vus).
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-200">
            <Send className="w-3.5 h-3.5" />
            {sendingType === "end" ? "Envoi en cours..." : "Envoyer par mail"}
          </span>
        </button>

        <button
          onClick={() => handleSendEmail("start")}
          disabled={sendingType !== null}
          className="rounded-2xl border border-sky-400/35 bg-gradient-to-br from-sky-500/20 to-sky-500/10 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-300/60 disabled:opacity-60"
        >
          <div className="flex items-center gap-2 text-sky-300">
            <CalendarClock className="w-5 h-5" />
            <p className="font-semibold">Récap début de semaine</p>
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            Envoie le plan de sprint de la semaine (besoins, prospection, kickoffs) par email.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs text-sky-200">
            <Send className="w-3.5 h-3.5" />
            {sendingType === "start" ? "Envoi en cours..." : "Envoyer par mail"}
          </span>
        </button>

        <button
          onClick={handleCopy}
          className="rounded-2xl border border-white/15 bg-zinc-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25"
        >
          <div className="flex items-center gap-2 text-zinc-300">
            <Copy className="w-5 h-5" />
            <p className="font-semibold">Copier le texte</p>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Copie le recap affiché pour partage rapide sur Slack/Teams.
          </p>
        </button>
      </div>

      <div className="bg-slate-900/70 border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/35 text-zinc-300 font-serif leading-relaxed" id="recap-content">
        <h2 className="text-xl font-bold text-white mb-4">📢 Récapitulatif Semaine {currentSemaine?.numero} ({currentSemaine?.annee})</h2>
        
        <p className="mb-4">Bonjour à tous,</p>
        <p className="mb-6">Voici le bilan de notre sprint de recrutement et prospection pour la semaine {currentSemaine?.numero} :</p>

        <h3 className="font-bold text-emerald-400 mb-2">🎯 Les Chiffres Clés</h3>
        <ul className="list-disc list-inside mb-6 space-y-1 ml-4">
          <li><strong>{kpiData?.global?.besoins_actifs || 0}</strong> besoins ouverts et actifs cette semaine.</li>
          <li><strong>{kpiData?.global?.profils_sources_recrut || 0}</strong> profils sourcés par l'équipe recrutement.</li>
          <li><strong>{profilsEnvoyes.length}</strong> profils poussés chez nos clients par l'équipe Biz.</li>
          <li><strong>{kpiData?.global?.hirings || 0}</strong> recrutements validés (hirings) ! 🎉</li>
        </ul>

        <h3 className="font-bold text-blue-400 mb-2">🤝 Focus Closings & Hirings</h3>
        {profilsHiring.length > 0 ? (
          <ul className="list-disc list-inside mb-6 space-y-1 ml-4">
            {profilsHiring.map((p: any) => {
               const b = (recapData?.besoins || []).find((b:any) => b.id === p.besoin_id);
               return <li key={p.id}>{p.candidat} a été validé pour le poste {b?.poste} chez {b?.client}.</li>
            })}
          </ul>
        ) : (
          <p className="mb-6 ml-4 italic">Aucun hiring validé cette semaine.</p>
        )}

        <h3 className="font-bold text-amber-400 mb-2">🚀 Nouveaux Kickoffs</h3>
        {recapData?.kickoffs?.length > 0 ? (
          <ul className="list-disc list-inside mb-6 space-y-1 ml-4">
            {recapData.kickoffs.map((k: any) => (
               <li key={k.id}>{k.consultant} a démarré chez {k.client} (Date : {k.date_demarrage || "Non précisée"}).</li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 ml-4 italic">Aucun nouveau démarrage cette semaine.</p>
        )}

        <h3 className="font-bold text-purple-400 mb-2">💼 Activité Prospection</h3>
        {recapData?.comptes?.length > 0 ? (
          <ul className="list-disc list-inside mb-6 space-y-1 ml-4">
            {recapData.comptes.map((c: any) => (
               <li key={c.id}>{c.compte} suivi par {c.commercial} ({c.nb_rdv} RDV générés).</li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 ml-4 italic">Aucun nouveau compte ciblé cette semaine.</p>
        )}

        <p className="mt-8 font-bold">Excellent week-end à tous !</p>
      </div>

    </div>
  );
}
