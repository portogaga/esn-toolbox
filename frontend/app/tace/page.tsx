"use client";

import { useState } from "react";
import { Activity, Target, TrendingDown, AlertTriangle } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const API_BASE = getApiBaseUrl();

type TaceResult = {
  jours_disponibles: number;
  jours_factures: number;
  tace_percent: number;
  ca_realise: number;
  ca_potentiel_max: number;
  manque_a_gagner: number;
};

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TacePage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [joursOuvres, setJoursOuvres] = useState("251");
  const [joursConges, setJoursConges] = useState("35");
  const [joursIntercontrat, setJoursIntercontrat] = useState("0");
  const [joursFormation, setJoursFormation] = useState("0");
  const [tjmMoyen, setTjmMoyen] = useState("");
  const [taceResult, setTaceResult] = useState<TaceResult | null>(null);
  const [taceLoading, setTaceLoading] = useState(false);
  const [taceError, setTaceError] = useState<string | null>(null);

  const handleTace = async () => {
    const joursOuvresNum = parseFloat(joursOuvres.replace(",", "."));
    const joursCongesNum = parseFloat(joursConges.replace(",", "."));
    const joursInterNum = parseFloat(joursIntercontrat.replace(",", "."));
    const joursFormNum = parseFloat(joursFormation.replace(",", "."));
    const tjmNum = parseFloat(tjmMoyen.replace(",", "."));

    if (Number.isNaN(joursOuvresNum) || joursOuvresNum <= 0) {
      setTaceError("Saisissez un nombre de jours ouvrés valide (> 0).");
      return;
    }
    if (Number.isNaN(joursCongesNum) || joursCongesNum < 0) {
      setTaceError("Saisissez un nombre de jours de congés & fériés valide (≥ 0).");
      return;
    }
    if (Number.isNaN(joursInterNum) || joursInterNum < 0) {
      setTaceError("Saisissez un nombre de jours d'inter-contrat valide (≥ 0).");
      return;
    }
    if (Number.isNaN(joursFormNum) || joursFormNum < 0) {
      setTaceError("Saisissez un nombre de jours de formation/interne valide (≥ 0).");
      return;
    }
    if (Number.isNaN(tjmNum) || tjmNum <= 0) {
      setTaceError("Saisissez un TJM moyen valide (> 0).");
      return;
    }

    setTaceError(null);
    setTaceResult(null);
    setTaceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calcul-tace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jours_ouvres: joursOuvresNum,
          jours_conges_feries: joursCongesNum,
          jours_intercontrat: joursInterNum,
          jours_formation: joursFormNum,
          tjm: tjmNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
        setTaceError(msg);
        setTaceResult(null);
        return;
      }
      setTaceResult(data as TaceResult);
    } catch {
      setTaceError("Serveur de calcul hors ligne.");
      setTaceResult(null);
    } finally {
      setTaceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Pilotage de la Performance (TACE)
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-600">
            Mesurez la véritable productivité de vos équipes. Le Taux d&apos;Activité Congés Exclus
            vous permet de piloter la performance de votre centre de services et de chiffrer le
            manque à gagner de l&apos;inactivité.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-slate-50">
                <Activity className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  Pilotage de la Performance : TACE
                </h2>
                <p className="text-xs text-zinc-9000">
                  Mesurez le taux d&apos;activité facturable réel et son impact sur le chiffre
                  d&apos;affaires.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Jours ouvrés / an
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={joursOuvres}
                onChange={(e) => {
                  setJoursOuvres(e.target.value);
                  setTaceError(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Congés & fériés (jours)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={joursConges}
                onChange={(e) => {
                  setJoursConges(e.target.value);
                  setTaceError(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Jours inter-contrat
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={joursIntercontrat}
                onChange={(e) => {
                  setJoursIntercontrat(e.target.value);
                  setTaceError(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Jours formation / interne
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={joursFormation}
                onChange={(e) => {
                  setJoursFormation(e.target.value);
                  setTaceError(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                <span>
                  TJM{" "}
                  <span className="ml-1 text-xs font-normal text-zinc-9000">
                    (facturé)
                  </span>
                </span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={tjmMoyen}
                onChange={(e) => {
                  setTjmMoyen(e.target.value);
                  setTaceError(null);
                }}
                placeholder="ex. 550"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleTace}
              disabled={taceLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {taceLoading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Calcul en cours…
                </>
              ) : (
                "Calculer le TACE"
              )}
            </button>
          </div>

          {taceError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{taceError}</p>
            </div>
          )}

          {taceResult && !taceError && (
            <div className="mt-6 space-y-4">
              {(() => {
                const t = taceResult.tace_percent;
                const colorClass =
                  t >= 95
                    ? "text-emerald-400"
                    : t >= 90
                    ? "text-amber-400"
                    : "text-red-400";
                const badgeBg =
                  t >= 95
                    ? "bg-emerald-900/40 text-emerald-200"
                    : t >= 90
                    ? "bg-amber-900/40 text-amber-200"
                    : "bg-red-900/40 text-red-700";
                return (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Target className={`h-6 w-6 ${colorClass}`} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-9000">
                          TACE — Taux d&apos;activité facturable
                        </p>
                        <p className={`mt-1 text-3xl font-extrabold sm:text-4xl ${colorClass}`}>
                          {t.toLocaleString("fr-FR", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                          %
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeBg}`}>
                      {t >= 95
                        ? "Zone optimale"
                        : t >= 90
                        ? "Zone de vigilance"
                        : "Sous-performance critique"}
                    </span>
                  </div>
                );
              })()}

              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-9000">
                    Jours facturés / disponibles
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-800">
                    {taceResult.jours_factures}{" "}
                    <span className="text-zinc-9000 text-sm">
                      / {taceResult.jours_disponibles}
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-9000">
                    Chiffre d&apos;affaires réalisé
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-400">
                    {formatEuro(taceResult.ca_realise)} {currencySymbol}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-9000">
                    Manque à gagner (banc & interne)
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-lg font-semibold text-red-400">
                    <TrendingDown className="h-4 w-4" />
                    <span>
                      {formatEuro(taceResult.manque_a_gagner)} {currencySymbol}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
