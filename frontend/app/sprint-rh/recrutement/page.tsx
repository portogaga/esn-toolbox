"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Send } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function RecrutementPage() {
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string>("");
  const [besoins, setBesoins] = useState<any[]>([]);
  const [candidateNames, setCandidateNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingBesoinId, setSubmittingBesoinId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [usingFallbackList, setUsingFallbackList] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSemaines = async () => {
    const res = await fetch(apiUrl("/sprint-rh/semaines"));
    const data = await res.json();
    if (Array.isArray(data)) {
      setSemaines(data);
      if (!currentSemaineId && data[0]?.id) setCurrentSemaineId(data[0].id);
    }
  };

  const fetchBesoins = async (semaineId: string) => {
    const res = await fetch(apiUrl(`/sprint-rh/besoins/en-cours?semaine_id=${semaineId}`));
    const data = await res.json();
    const inProgress = Array.isArray(data) ? data : [];
    if (inProgress.length > 0) {
      setUsingFallbackList(false);
      setBesoins(inProgress);
      return;
    }

    const fallbackRes = await fetch(apiUrl(`/sprint-rh/besoins?semaine_id=${semaineId}`));
    const fallbackData = await fallbackRes.json();
    const fullWeekList = Array.isArray(fallbackData) ? fallbackData : [];
    setUsingFallbackList(fullWeekList.length > 0);
    setBesoins(fullWeekList);
  };

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchSemaines()
      .catch(() => setLoadError("Impossible de charger les sprints (API indisponible)."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentSemaineId) return;
    fetchBesoins(currentSemaineId).catch(() =>
      setLoadError("Impossible de charger les besoins pour ce sprint.")
    );
  }, [currentSemaineId]);

  const clientsCount = useMemo(() => new Set(besoins.map((b) => b.client)).size, [besoins]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const addProfil = async (besoin: any) => {
    const candidat = (candidateNames[besoin.id] || "").trim();
    if (!candidat) return;
    setSubmittingBesoinId(besoin.id);
    try {
      const payload = {
        besoin_id: besoin.id,
        recruteur: "Equipe Recrutement",
        candidat,
        statut_validation: "attente_biz",
      };
      const res = await fetch(apiUrl("/sprint-rh/profils"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCandidateNames((prev) => ({ ...prev, [besoin.id]: "" }));
        showToast("Profil ajoute avec succes");
      } else {
        const err = await res.text();
        showToast(err || "Erreur lors de l'ajout du profil");
      }
    } catch {
      showToast("Erreur reseau");
    } finally {
      setSubmittingBesoinId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-sky-400">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <section className="rounded-3xl border border-white/15 bg-gradient-to-br from-zinc-900/95 via-zinc-900/85 to-black/95 p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Recrutement</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Besoins en cours</h1>
            <p className="mt-2 text-sm text-zinc-400">Ajoute rapidement un profil sur un besoin puis valide.</p>
          </div>
          <select
            value={currentSemaineId}
            onChange={(e) => setCurrentSemaineId(e.target.value)}
            className="rounded-xl border border-white/15 bg-zinc-950/90 px-3 py-2 text-sm text-zinc-100"
          >
            {semaines.map((s) => (
              <option key={s.id} value={s.id}>
                Sprint {s.numero} ({s.annee})
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Besoins actifs</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">{besoins.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Clients concernes</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{clientsCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Mode</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">Ajout de profil rapide</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/15 bg-zinc-900/70 p-5 shadow-xl shadow-black/20">
        <div className="space-y-3">
          {loadError && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {loadError}
            </p>
          )}
          {usingFallbackList && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-200">
              Aucun besoin actif detecte. Affichage de tous les besoins du sprint pour te permettre d'ajouter des profils.
            </p>
          )}
          {besoins.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/20 bg-zinc-950/70 p-5 text-sm text-zinc-500">
              Aucun besoin en cours sur ce sprint.
            </p>
          )}
          {besoins.map((b) => (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{b.poste}</p>
                  <p className="text-xs text-zinc-500">{b.client} - Biz owner: {b.biz_owner}</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-white/20 bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-300">
                  {b.priorite || "P1"}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={candidateNames[b.id] || ""}
                  onChange={(e) => setCandidateNames((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  placeholder="Nom du profil candidat"
                  className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                />
                <button
                  onClick={() => addProfil(b)}
                  disabled={submittingBesoinId === b.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submittingBesoinId === b.id ? "Validation..." : "Valider"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
