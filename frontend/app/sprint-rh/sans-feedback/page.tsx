"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Clock, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function SansFeedbackPage() {
  const [profils, setProfils] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchProfils = async () => {
    try {
      const res = await fetch(apiUrl("/sprint-rh/profils/sans-feedback"));
      const data = await res.json();
      setProfils(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfils();
  }, []);

  const handleUpdateFeedback = async (id: string, feedback: string) => {
    try {
      const res = await fetch(apiUrl(`/sprint-rh/profils/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback_biz: feedback }),
      });
      if (res.ok) {
        setToast("Feedback mis à jour");
        setTimeout(() => setToast(null), 3000);
        fetchProfils();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Chargement...</div>;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Inconnue";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-amber-500" />
          Profils Sans Feedback
        </h1>
        <p className="text-zinc-400 mt-2">
          Voici la liste de tous les profils envoyés au client (historique complet) qui sont toujours en attente d'une réponse. Relancez les clients pour ces candidats !
        </p>
      </div>

      {profils.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/90 p-8 rounded-3xl shadow-2xl shadow-black/30 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tout est à jour !</h2>
          <p className="text-zinc-400">Aucun profil n'est en attente de feedback client.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950/60 text-xs uppercase text-zinc-500 border-b border-slate-800/90">
              <tr>
                <th className="px-6 py-4 font-medium">Date d'envoi</th>
                <th className="px-6 py-4 font-medium">Candidat</th>
                <th className="px-6 py-4 font-medium">Client & Poste</th>
                <th className="px-6 py-4 font-medium">Biz Owner</th>
                <th className="px-6 py-4 font-medium text-right">Action (Feedback)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {profils.map((p) => {
                const age = Math.floor((new Date().getTime() - new Date(p.date_envoi).getTime()) / (1000 * 3600 * 24));
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${age > 14 ? 'text-red-400' : age > 7 ? 'text-amber-400' : 'text-zinc-400'}`} />
                        <span className={age > 14 ? 'text-red-400 font-medium' : ''}>{formatDate(p.date_envoi)}</span>
                      </div>
                      {age > 0 && <div className="text-xs text-zinc-600 mt-1">Il y a {age} jours</div>}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {p.candidat}
                      <div className="text-xs text-zinc-500 font-normal mt-1">Sourcé par {p.recruteur}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-emerald-400">{p.besoins?.client || "Inconnu"}</span>
                      <div className="text-xs mt-1">{p.besoins?.poste || "Inconnu"}</div>
                    </td>
                    <td className="px-6 py-4">
                      {p.besoins?.biz_owner || "Inconnu"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateFeedback(p.id, 'positif')}
                          title="Retour Positif (Entretien)"
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 p-2 rounded transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateFeedback(p.id, 'hiring')}
                          title="Hiring (Closer le profil)"
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 p-2 rounded transition font-medium text-xs flex items-center"
                        >
                          Hiring
                        </button>
                        <button 
                          onClick={() => handleUpdateFeedback(p.id, 'negatif')}
                          title="Retour Négatif (Refus)"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 p-2 rounded transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
