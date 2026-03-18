"use client";

import { useState } from "react";
import { Scale, User, Building2, AlertTriangle } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type ComparateurResult = {
  ca_total: number;
  jours_totaux: number;
  freelance: {
    cout_total: number;
    marge_brute: number;
    marge_pourcent: number;
  };
  cdi: {
    cout_total: number;
    marge_brute: number;
    marge_pourcent: number;
  };
  recommandation: "CDI" | "Freelance";
  difference_marge: number;
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

export default function ComparateurPage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [tjmClient, setTjmClient] = useState("");
  const [dureeMois, setDureeMois] = useState("");
  const [tjmFreelance, setTjmFreelance] = useState("");
  const [salaireBrutCdi, setSalaireBrutCdi] = useState("");
  const [comparateurResult, setComparateurResult] =
    useState<ComparateurResult | null>(null);
  const [comparateurLoading, setComparateurLoading] = useState(false);
  const [comparateurError, setComparateurError] = useState<string | null>(null);

  const handleComparateur = async () => {
    const tjmClientNum = parseFloat(tjmClient.replace(",", "."));
    const dureeNum = parseFloat(dureeMois.replace(",", "."));
    const tjmFreeNum = parseFloat(tjmFreelance.replace(",", "."));
    const salaireCdiNum = parseFloat(salaireBrutCdi.replace(",", "."));

    if (Number.isNaN(tjmClientNum) || tjmClientNum <= 0) {
      setComparateurError("Saisissez un TJM client valide (> 0).");
      return;
    }
    if (Number.isNaN(dureeNum) || dureeNum <= 0) {
      setComparateurError("Saisissez une durée de mission valide (mois > 0).");
      return;
    }
    if (Number.isNaN(tjmFreeNum) || tjmFreeNum <= 0) {
      setComparateurError("Saisissez un TJF freelance valide (> 0).");
      return;
    }
    if (Number.isNaN(salaireCdiNum) || salaireCdiNum <= 0) {
      setComparateurError("Saisissez un salaire brut CDI valide (> 0).");
      return;
    }

    setComparateurError(null);
    setComparateurResult(null);
    setComparateurLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calcul-comparateur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tjm_client: tjmClientNum,
          tjm_freelance: tjmFreeNum,
          salaire_brut_mensuel_cdi: salaireCdiNum,
          duree_mois: Math.round(dureeNum),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
        setComparateurError(msg);
        setComparateurResult(null);
        return;
      }
      setComparateurResult(data as ComparateurResult);
    } catch {
      setComparateurError("Serveur de calcul hors ligne.");
      setComparateurResult(null);
    } finally {
      setComparateurLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Aide à la Décision : CDI vs Sous-traitance
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Sécurisez votre stratégie de staffing. Comparez la rentabilité nette d&apos;un recrutement
            interne face au recours à un prestataire freelance sur la durée exacte de votre projet.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/80">
                <Scale className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Comparateur : Recrutement CDI vs Sous-traitance Freelance
                </h2>
                <p className="text-xs text-zinc-500">
                  Comparez, sur une mission donnée, l&apos;impact financier de chaque scénario.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
                value={tjmClient}
                onChange={(e) => {
                  setTjmClient(e.target.value);
                  setComparateurError(null);
                }}
                placeholder="ex. 650"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Durée de la mission (mois)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={dureeMois}
                onChange={(e) => {
                  setDureeMois(e.target.value);
                  setComparateurError(null);
                }}
                placeholder="ex. 12"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                TJF Freelance demandé
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={tjmFreelance}
                onChange={(e) => {
                  setTjmFreelance(e.target.value);
                  setComparateurError(null);
                }}
                placeholder="ex. 500"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Salaire Brut Mensuel CDI
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={salaireBrutCdi}
                onChange={(e) => {
                  setSalaireBrutCdi(e.target.value);
                  setComparateurError(null);
                }}
                placeholder="ex. 4000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleComparateur}
              disabled={comparateurLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {comparateurLoading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Lancer le duel financier…
                </>
              ) : (
                "Lancer le duel financier"
              )}
            </button>
          </div>

          {comparateurError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{comparateurError}</p>
            </div>
          )}

          {comparateurResult && !comparateurError && (
            <div className="mt-6 space-y-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-zinc-400">Chiffre d&apos;affaires total généré</span>
                <span className="font-semibold text-zinc-100">
                  {formatEuro(comparateurResult.ca_total)} {currencySymbol}{" "}
                  <span className="text-xs text-zinc-500">
                    ({comparateurResult.jours_totaux} jours)
                  </span>
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {["Freelance", "CDI"].map((type) => {
                  const isFreelance = type === "Freelance";
                  const data = isFreelance ? comparateurResult.freelance : comparateurResult.cdi;
                  const isBest = comparateurResult.recommandation === type;
                  return (
                    <div
                      key={type}
                      className={`rounded-2xl border bg-zinc-950/70 p-4 text-sm transition ${
                        isBest
                          ? "border-emerald-500/70 ring-2 ring-emerald-500/30"
                          : "border-zinc-700/80"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                          {isFreelance ? (
                            <User className="h-3.5 w-3.5 text-zinc-300" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-zinc-300" />
                          )}
                          <span>{isFreelance ? "Option Freelance" : "Option CDI interne"}</span>
                        </div>
                        {isBest && (
                          <span className="rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                            Plus rentable
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 font-mono text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Coût total</span>
                          <span className="text-zinc-100">{formatEuro(data.cout_total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Marge brute</span>
                          <span className="text-zinc-100">{formatEuro(data.marge_brute)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Marge (%)</span>
                          <span className="text-zinc-100">
                            {formatPct(data.marge_pourcent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 rounded-2xl border border-emerald-700/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
                <p>
                  En choisissant{" "}
                  <span className="font-semibold">
                    {comparateurResult.recommandation === "CDI"
                      ? "l&apos;option CDI interne"
                      : "l&apos;option Freelance"}
                  </span>
                  , vous générez{" "}
                  <span className="font-semibold">
                    {formatEuro(comparateurResult.difference_marge)} {currencySymbol}
                  </span>{" "}
                  de marge en plus sur la mission.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
