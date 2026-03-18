"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type SimulateurResult = {
  cjm: number | null;
  tjm: number | null;
  marge_percent: number | null;
  gain: number | null;
  mode: string;
};

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " %"
  );
}

export default function RentabilitePage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [cjm, setCjm] = useState("");
  const [tjm, setTjm] = useState("");
  const [marge, setMarge] = useState("");

  const [result, setResult] = useState<SimulateurResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [scorecardVisible, setScorecardVisible] = useState(false);

  const getFilled = useCallback(() => {
    const cjmNum = parseFloat(cjm.replace(",", "."));
    const tjmNum = parseFloat(tjm.replace(",", "."));
    const margeNum = parseFloat(marge.replace(",", "."));
    const filled = {
      cjm: !Number.isNaN(cjmNum),
      tjm: !Number.isNaN(tjmNum),
      marge: !Number.isNaN(margeNum),
    };
    const count = [filled.cjm, filled.tjm, filled.marge].filter(Boolean).length;
    return { count, cjmNum, tjmNum, margeNum, filled };
  }, [cjm, tjm, marge]);

  useEffect(() => {
    const { count, cjmNum, tjmNum, margeNum } = getFilled();
    setError(null);

    if (count !== 2) {
      setResult(null);
      setScorecardVisible(false);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setBackendOffline(false);
        const res = await fetch(`${API_BASE}/simulateur`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cjm: Number.isNaN(cjmNum) ? null : cjmNum,
            tjm: Number.isNaN(tjmNum) ? null : tjmNum,
            marge_percent: Number.isNaN(margeNum) ? null : margeNum,
          }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data.detail === "string"
              ? data.detail
              : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
          setError(msg);
          setResult(null);
          setScorecardVisible(false);
          return;
        }
        setResult(data as SimulateurResult);
        setError(null);
        setScorecardVisible(true);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setBackendOffline(true);
        setError(null);
        setResult(null);
        setScorecardVisible(false);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [getFilled]);

  const handleReset = () => {
    setCjm("");
    setTjm("");
    setMarge("");
    setResult(null);
    setError(null);
    setScorecardVisible(false);
  };

  const getMissingLabel = (r: SimulateurResult) => {
    switch (r.mode) {
      case "Calcul de Marge":
        return "Marge calculée";
      case "Calcul de TJM":
        return "TJM cible";
      case "Calcul de CJM Max":
        return "CJM max";
      default:
        return "Valeur calculée";
    }
  };

  const getMissingValue = (r: SimulateurResult) => {
    if (r.mode === "Calcul de Marge") return formatPct(r.marge_percent);
    if (r.mode === "Calcul de TJM")
      return `${formatEuro(r.tjm)} ${currencySymbol}`;
    if (r.mode === "Calcul de CJM Max")
      return `${formatEuro(r.cjm)} ${currencySymbol}`;
    return "—";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {backendOffline && (
          <p
            className="mb-6 rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-2.5 text-center text-sm text-amber-200/90"
            role="status"
          >
            Serveur de calcul hors ligne.
          </p>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Pilotage de la Marge Commerciale
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Simulez instantanément la rentabilité de vos missions. Saisissez vos tarifs de vente et
            vos coûts de production pour obtenir une vision claire de votre marge brute, sans calculs
            intermédiaires.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Wallet className="h-4 w-4 text-sky-400" />
            Paramètres
          </h2>

          <div className="grid gap-6 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                CJM / PRJ / Coût journalier CDI
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={cjm}
                onChange={(e) => setCjm(e.target.value)}
                placeholder="ex. 350"
                className="w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                <span>
                  TJM{" "}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    (facturé)
                  </span>
                </span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={tjm}
                onChange={(e) => setTjm(e.target.value)}
                placeholder="ex. 550"
                className="w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Marge cible (%)
              </label>
              <input
                type="number"
                min={0}
                max={99}
                step={0.1}
                value={marge}
                onChange={(e) => setMarge(e.target.value)}
                placeholder="ex. 25"
                className="w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
            {loading && (
              <span className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                Calcul en cours…
              </span>
            )}
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}
        </section>

        <section
          className={`mt-8 overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/70 shadow-2xl shadow-black/30 transition-all duration-300 ${
            scorecardVisible && result
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="border-b border-slate-800/90 px-6 py-4 sm:px-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Résultat de la simulation
            </h2>
          </div>
          {result && (
            <div className="p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700/80 bg-zinc-950/60 p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Gain par jour
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-400 sm:text-4xl">
                    {formatEuro(result.gain)} {currencySymbol}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700/80 bg-zinc-950/60 p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {getMissingLabel(result)}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-sky-400 sm:text-4xl">
                    {getMissingValue(result)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-zinc-300">
                  CJM {formatEuro(result.cjm)} {currencySymbol}
                </span>
                <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-zinc-300">
                  TJM {formatEuro(result.tjm)} {currencySymbol}
                </span>
                <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-zinc-300">
                  Marge {formatPct(result.marge_percent)}
                </span>
              </div>
              <p className="mt-4 text-xs text-zinc-500">
                Mode : {result.mode}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

