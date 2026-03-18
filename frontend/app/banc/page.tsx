"use client";

import { useState } from "react";
import { AlertTriangle, Calendar, Hourglass } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type BancResult = {
  cjm: number;
  tjm: number;
  jours_banc: number;
  cout_total_banc: number;
  marge_journaliere: number;
  jours_facturation_necessaires: number;
};

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BancPage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [cjmBanc, setCjmBanc] = useState("");
  const [tjmBanc, setTjmBanc] = useState("");
  const [joursBanc, setJoursBanc] = useState("");
  const [bancResult, setBancResult] = useState<BancResult | null>(null);
  const [bancLoading, setBancLoading] = useState(false);
  const [bancError, setBancError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  const handleCalculBanc = async () => {
    const cjmNum = parseFloat(cjmBanc.replace(",", "."));
    const tjmNum = parseFloat(tjmBanc.replace(",", "."));
    const joursNum = parseFloat(joursBanc.replace(",", "."));
    const joursInt = Math.round(joursNum);

    if (Number.isNaN(cjmNum) || cjmNum < 0) {
      setBancError("Saisissez un CJM valide (nombre ≥ 0).");
      return;
    }
    if (Number.isNaN(tjmNum) || tjmNum < 0) {
      setBancError("Saisissez un TJM valide (nombre ≥ 0).");
      return;
    }
    if (Number.isNaN(joursNum) || joursInt < 0) {
      setBancError("Saisissez un nombre de jours sur le banc valide (≥ 0).");
      return;
    }

    setBancError(null);
    setBancResult(null);
    setBancLoading(true);
    try {
      setBackendOffline(false);
      const res = await fetch(`${API_BASE}/calcul-banc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cjm: cjmNum,
          tjm: tjmNum,
          jours_banc: joursInt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
        setBancError(msg);
        setBancResult(null);
        return;
      }
      setBancResult(data as BancResult);
    } catch {
      setBackendOffline(true);
      setBancError("Serveur de calcul hors ligne.");
      setBancResult(null);
    } finally {
      setBancLoading(false);
    }
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
            Analyse du Coût d&apos;Inter-contrat
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Visualisez l&apos;impact financier de l&apos;inter-contrat sur la trésorerie de
            l&apos;agence. Mesurez le coût réel des jours non facturés et déterminez la durée de
            facturation nécessaire pour absorber cette perte.
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-slate-800/90 bg-slate-900/60 p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Hourglass className="h-4 w-4 text-slate-400" />
            Impact de l&apos;Inter-contrat (Le Banc)
          </h2>
          <p className="mb-6 text-sm text-zinc-500">
            Estimez le coût du banc et le nombre de jours de facturation
            nécessaires pour l&apos;absorber.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                CJM / PRJ / Coût journalier CDI
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={cjmBanc}
                onChange={(e) => {
                  setCjmBanc(e.target.value);
                  setBancError(null);
                }}
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
                value={tjmBanc}
                onChange={(e) => {
                  setTjmBanc(e.target.value);
                  setBancError(null);
                }}
                placeholder="ex. 550"
                className="w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                Jours sur le banc
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={joursBanc}
                onChange={(e) => {
                  setJoursBanc(e.target.value);
                  setBancError(null);
                }}
                placeholder="ex. 15"
                className="w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleCalculBanc}
              disabled={bancLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {bancLoading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Calcul en cours…
                </>
              ) : (
                "Calculer l'impact"
              )}
            </button>
          </div>

          {bancError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{bancError}</p>
            </div>
          )}

          {bancResult && !bancError && (
            <div className="mt-6 rounded-2xl border border-slate-700/80 bg-slate-950/80 p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Résultats
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-red-300/90">
                    Coût total du banc
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-400">
                    {formatEuro(bancResult.cout_total_banc)} {currencySymbol}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-sky-300/90">
                    Marge journalière générée
                  </p>
                  <p className="mt-1 text-2xl font-bold text-sky-400">
                    {formatEuro(bancResult.marge_journaliere)} {currencySymbol}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-emerald-700/70 bg-emerald-950/30 p-4 ring-2 ring-emerald-500/20">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/90">
                    Jours de facturation pour absorber
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-400">
                    {new Intl.NumberFormat("fr-FR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }).format(bancResult.jours_facturation_necessaires)}{" "}
                    <span className="text-lg font-semibold text-emerald-300/80">
                      jours
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

