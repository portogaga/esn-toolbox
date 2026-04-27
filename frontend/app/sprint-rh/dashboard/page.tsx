"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Briefcase,
  BarChart3,
  ArrowUpRight,
  Search,
  Target,
  Rocket,
  CheckCircle2,
  Clock3,
  Expand,
  Shrink,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function SprintDashboard() {
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedBesoinId, setSelectedBesoinId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedBesoinId, setDraggedBesoinId] = useState<string | null>(null);
  const [clientOrder, setClientOrder] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch(apiUrl("/sprint-rh/semaines"))
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setSemaines([]);
          setLoading(false);
          return;
        }
        setSemaines(data);
        if (data.length > 0) setCurrentSemaineId(data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentSemaineId) return;
    setLoading(true);
    Promise.all([
      fetch(apiUrl(`/sprint-rh/recap/${currentSemaineId}`)).then((r) => r.json()),
      fetch(apiUrl(`/sprint-rh/kpis/${currentSemaineId}`)).then((r) => r.json()),
    ])
      .then(([recap, kpis]) => {
        setRecapData(recap);
        setKpiData(kpis);
      })
      .finally(() => setLoading(false));
  }, [currentSemaineId]);

  useEffect(() => {
    setSelectedBesoinId(null);
  }, [currentSemaineId]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const isHistorical = semaines.length > 0 && currentSemaineId !== semaines[0].id;
  const besoinsRaw = recapData?.besoins || [];
  const profilsRaw = recapData?.profils || [];
  const comptesRaw = recapData?.comptes || [];

  const clients: string[] = useMemo(
    () => Array.from(new Set<string>(besoinsRaw.map((b: any) => String(b.client || "Inconnu")))).sort(),
    [besoinsRaw]
  );

  const filteredBesoins = useMemo(
    () =>
      besoinsRaw.filter((b: any) => {
        const matchesClient = selectedClient === "all" || b.client === selectedClient;
        const term = query.trim().toLowerCase();
        const matchesQuery =
          term.length === 0 ||
          b.poste?.toLowerCase().includes(term) ||
          b.client?.toLowerCase().includes(term) ||
          b.biz_owner?.toLowerCase().includes(term);
        return matchesClient && matchesQuery;
      }),
    [besoinsRaw, selectedClient, query]
  );

  useEffect(() => {
    const byClient: Record<string, string[]> = {};
    for (const b of filteredBesoins) {
      const client = String(b.client || "Inconnu");
      byClient[client] = byClient[client] || [];
      byClient[client].push(b.id);
    }

    setClientOrder((prev) => {
      const next: Record<string, string[]> = {};
      for (const [client, ids] of Object.entries(byClient)) {
        const previous = prev[client] || [];
        const kept = previous.filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !kept.includes(id));
        next[client] = [...kept, ...missing];
      }
      return next;
    });
  }, [filteredBesoins]);

  const besoinsByClient = useMemo(
    () =>
      filteredBesoins.reduce((acc: any, b: any) => {
        acc[b.client] = acc[b.client] || [];
        acc[b.client].push(b);
        return acc;
      }, {}),
    [filteredBesoins]
  );

  const sortedBesoinsByClient = useMemo(() => {
    const result: Record<string, any[]> = {};
    for (const [client, list] of Object.entries(besoinsByClient)) {
      const order = clientOrder[client] || [];
      const rank = new Map(order.map((id, index) => [id, index]));
      result[client] = [...(list as any[])].sort((a, b) => {
        const ai = rank.get(a.id);
        const bi = rank.get(b.id);
        if (ai === undefined && bi === undefined) return 0;
        if (ai === undefined) return 1;
        if (bi === undefined) return -1;
        return ai - bi;
      });
    }
    return result;
  }, [besoinsByClient, clientOrder]);

  const prospectionByComm = useMemo(
    () =>
      comptesRaw.reduce((acc: any, c: any) => {
        acc[c.commercial] = acc[c.commercial] || [];
        acc[c.commercial].push(c);
        return acc;
      }, {}),
    [comptesRaw]
  );

  const feedbackList = useMemo(
    () =>
      profilsRaw
        .filter((p: any) => p.statut_validation === "envoye_client" && p.feedback_biz === "en_attente")
        .map((p: any) => {
          const b = besoinsRaw.find((item: any) => item.id === p.besoin_id);
          return { ...p, client: b?.client || "Inconnu", poste: b?.poste || "Inconnu" };
        }),
    [profilsRaw, besoinsRaw]
  );

  const closingsList = useMemo(
    () =>
      profilsRaw
        .filter((p: any) => p.feedback_biz === "hiring")
        .map((p: any) => {
          const b = besoinsRaw.find((item: any) => item.id === p.besoin_id);
          return { ...p, client: b?.client || "Inconnu", poste: b?.poste || "Inconnu" };
        }),
    [profilsRaw, besoinsRaw]
  );

  const selectedBesoin =
    filteredBesoins.find((b: any) => b.id === selectedBesoinId) ||
    (filteredBesoins.length > 0 ? filteredBesoins[0] : null);
  const selectedBesoinProfils = selectedBesoin
    ? profilsRaw.filter((p: any) => p.besoin_id === selectedBesoin.id)
    : [];

  const KpiCard = ({ title, value, colorClass }: { title: string; value: number; colorClass: string }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-black/95 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/15" />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{title}</p>
      <p className={`relative mt-2 text-3xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );

  const recruiterKpis = Object.entries(kpiData?.par_recruteur || {}) as Array<
    [string, { sourcés?: number; envoyés_biz?: number; hirings?: number; ko?: number }]
  >;

  const getPriorityStyles = (priorite?: string) => {
    if (priorite === "P0") return "border-rose-400/40 bg-rose-500/10 text-rose-300";
    if (priorite === "P1") return "border-amber-400/40 bg-amber-500/10 text-amber-300";
    return "border-sky-400/40 bg-sky-500/10 text-sky-300";
  };

  const getStatutStyles = (statut?: string) => {
    if (statut === "clos" || statut === "pourvu") return "text-emerald-300 bg-emerald-500/10 border-emerald-400/40";
    if (statut === "bloque") return "text-rose-300 bg-rose-500/10 border-rose-400/40";
    if (statut === "reporte") return "text-violet-300 bg-violet-500/10 border-violet-400/40";
    return "text-zinc-300 bg-zinc-500/10 border-white/20";
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  };

  const reorderWithinClient = (client: string, fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    setClientOrder((prev) => {
      const current = [...(prev[client] || [])];
      const fromIndex = current.indexOf(fromId);
      const toIndex = current.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      current.splice(fromIndex, 1);
      current.splice(toIndex, 0, fromId);
      return { ...prev, [client]: current };
    });
  };

  if (loading && !recapData) {
    return (
      <div className="flex justify-center py-20 text-sky-500">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!semaines.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <p className="text-zinc-500">Aucun sprint n'a encore été créé.</p>
        <a
          href="/sprint-rh/sprint"
          className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:bg-slate-700"
        >
          Planifier un Sprint
        </a>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-56 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 top-32 h-44 w-44 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-60 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-black/95 p-6 sm:p-8 shadow-[0_24px_55px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.12),transparent_38%),radial-gradient(circle_at_90%_85%,rgba(217,70,239,0.12),transparent_45%)]" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Sprint RH</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-50 sm:text-3xl">Vue d'ensemble</h1>
            <p className="mt-2 text-sm text-zinc-400">Grand tableau d'animation de sprint, comme en salle de pilotage.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={currentSemaineId || ""}
              onChange={(e) => setCurrentSemaineId(e.target.value)}
              className="rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {semaines.map((s) => (
                <option key={s.id} value={s.id}>
                  Sprint {s.numero} ({s.annee})
                </option>
              ))}
            </select>
            {isHistorical && (
              <button
                onClick={() => setCurrentSemaineId(semaines[0].id)}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-800/60 bg-sky-950/40 px-4 py-2 text-sm text-sky-300 transition hover:bg-sky-900/50"
              >
                Sprint Courant <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/25 hover:bg-zinc-800"
              title="Mode salle de guerre"
            >
              {isFullscreen ? <Shrink className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
              {isFullscreen ? "Quitter écran" : "Plein écran"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Besoins actifs" value={kpiData?.global?.besoins_actifs || 0} colorClass="text-zinc-100" />
        <KpiCard title="Sourcés (Recrut)" value={kpiData?.global?.profils_sources_recrut || 0} colorClass="text-sky-400" />
        <KpiCard title="Envoyés (Biz)" value={kpiData?.global?.profils_envoyes_biz || 0} colorClass="text-indigo-400" />
        <KpiCard title="Hirings" value={kpiData?.global?.hirings || 0} colorClass="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-900/85 to-black/90 p-5 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.12),transparent_32%)]" />
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
              <Briefcase className="h-4 w-4 text-sky-400" />
              Mur des besoins
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher poste/client/biz"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/80 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none ring-0 placeholder:text-zinc-500 focus:border-sky-500/60 sm:w-64"
                />
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-sky-500/60"
              >
                <option value="all">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-h-[600px] space-y-4 overflow-auto pr-1">
              {Object.keys(besoinsByClient).length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 p-6 text-sm text-zinc-500">
                  Aucun besoin trouvé avec les filtres actuels.
                </p>
              )}
              {Object.keys(sortedBesoinsByClient).map((client) => (
                <div key={client} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{client}</h3>
                  {sortedBesoinsByClient[client].map((b: any) => {
                    const pForB = profilsRaw.filter((p: any) => p.besoin_id === b.id);
                    const nbSources = pForB.length;
                    const nbEnvoyes = pForB.filter((p: any) => p.statut_validation === "envoye_client").length;
                    const isActive = (selectedBesoin?.id || selectedBesoinId) === b.id;
                    return (
                      <button
                        key={b.id}
                        draggable
                        onDragStart={() => setDraggedBesoinId(b.id)}
                        onDragEnd={() => setDraggedBesoinId(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (!draggedBesoinId) return;
                          reorderWithinClient(client, draggedBesoinId, b.id);
                          setDraggedBesoinId(null);
                        }}
                        onClick={() => setSelectedBesoinId(b.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-all duration-200 ${
                          isActive
                            ? "border-sky-300/70 bg-gradient-to-br from-sky-400/20 to-indigo-500/15 shadow-[0_10px_30px_rgba(56,189,248,0.2)]"
                            : "border-white/10 bg-zinc-950/65 hover:-translate-y-0.5 hover:border-white/30 hover:bg-zinc-900/90"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="flex items-center gap-1 text-sm font-medium text-zinc-100">
                              <GripVertical className="h-3.5 w-3.5 text-zinc-600" />
                              {b.poste}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">Biz owner: {b.biz_owner}</p>
                          </div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${getPriorityStyles(b.priorite)}`}
                          >
                            {b.priorite}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${getStatutStyles(b.statut)}`}>
                            {b.statut || "nouveau"}
                          </span>
                          {isActive && <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-zinc-900/80 p-2">
                            <p className="text-zinc-500">Sourcés</p>
                            <p className="font-semibold text-sky-300">{nbSources}</p>
                          </div>
                          <div className="rounded-lg bg-zinc-900/80 p-2">
                            <p className="text-zinc-500">Envoyés</p>
                            <p className="font-semibold text-indigo-300">{nbEnvoyes}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-950/85 to-black/75 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                <Target className="h-3.5 w-3.5 text-sky-400" />
                Focus besoin
              </h3>
              {!selectedBesoin ? (
                <p className="mt-4 text-sm text-zinc-500">Sélectionne un besoin à gauche pour voir ses détails et son pipeline.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
                    <p className="text-sm font-semibold text-zinc-100">{selectedBesoin.poste}</p>
                    <p className="mt-1 text-xs text-zinc-500">{selectedBesoin.client}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${getPriorityStyles(selectedBesoin.priorite)}`}
                      >
                        {selectedBesoin.priorite || "P1"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${getStatutStyles(selectedBesoin.statut)}`}
                      >
                        {selectedBesoin.statut || "nouveau"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Pipeline candidat</p>
                    <div className="space-y-2">
                      {selectedBesoinProfils.length === 0 && (
                        <p className="rounded-xl border border-dashed border-white/15 bg-zinc-900/40 p-3 text-xs text-zinc-500">
                          Aucun profil encore lié à ce besoin.
                        </p>
                      )}
                      {selectedBesoinProfils.map((p: any) => (
                        <div key={p.id} className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
                          <p className="text-sm text-zinc-200">{p.candidat}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {p.recruteur} · {p.statut_validation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-900/85 to-black/90 p-5 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.12),transparent_32%)]" />
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Colonne prospection
          </h2>
          <div className="max-h-[600px] space-y-4 overflow-auto pr-1">
            {Object.keys(prospectionByComm).length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 p-6 text-sm text-zinc-500">
                Aucun compte en prospection sur ce sprint.
              </p>
            )}
            {Object.keys(prospectionByComm).map((comm) => (
              <div key={comm} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{comm}</p>
                <div className="space-y-2">
                  {prospectionByComm[comm].map((c: any) => (
                    <div
                      key={c.id}
                      className="group flex items-center justify-between rounded-xl border border-white/15 bg-zinc-900/60 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-purple-300/60 hover:bg-zinc-900"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{c.compte}</p>
                        <p className="mt-1 text-xs text-zinc-500">{c.statut || "a_prospecter"}</p>
                      </div>
                      <span className="rounded-lg border border-white/10 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-300">
                        {c.nb_rdv} RDV
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-900/85 to-black/90 p-5 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.12),transparent_32%)]" />
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            <Clock3 className="h-4 w-4 text-amber-400" />
            Feedback en attente
          </h2>
          <div className="space-y-2">
            {feedbackList.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 p-6 text-sm text-zinc-500">
                Aucun feedback en attente.
              </p>
            )}
            {feedbackList.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-zinc-950/70 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/60"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{p.candidat}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {p.client} · {p.poste}
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Relance</span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/95 via-zinc-900/85 to-black/90 p-5 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.12),transparent_32%)]" />
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
            <Rocket className="h-4 w-4 text-emerald-400" />
            Closings / Hirings
          </h2>
          <div className="space-y-2">
            {closingsList.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 p-6 text-sm text-zinc-500">
                Aucun hiring enregistré pour le moment.
              </p>
            )}
            {closingsList.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-zinc-950/70 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/60"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{p.candidat}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {p.client} · {p.poste}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hiring
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/15 bg-zinc-900/70 p-5 sm:p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">KPIs par recruteur</h2>
          <span className="text-xs text-zinc-500">{recruiterKpis.length} recruteur(s)</span>
        </div>

        {recruiterKpis.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-zinc-950/50 p-4 text-sm text-zinc-500">
            Aucune donnée recruteur pour ce sprint.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recruiterKpis.map(([recruteur, stats]) => (
              <div key={recruteur} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <p className="text-sm font-semibold text-zinc-100">{recruteur}</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="rounded-lg bg-zinc-900/80 p-2 text-center">
                    <p className="text-[10px] uppercase text-zinc-500">Sourcés</p>
                    <p className="text-sm font-semibold text-sky-300">{stats?.sourcés || 0}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 p-2 text-center">
                    <p className="text-[10px] uppercase text-zinc-500">Envoyés</p>
                    <p className="text-sm font-semibold text-indigo-300">{stats?.envoyés_biz || 0}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 p-2 text-center">
                    <p className="text-[10px] uppercase text-zinc-500">KO</p>
                    <p className="text-sm font-semibold text-rose-300">{stats?.ko || 0}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 p-2 text-center">
                    <p className="text-[10px] uppercase text-zinc-500">Hiring</p>
                    <p className="text-sm font-semibold text-emerald-300">{stats?.hirings || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
