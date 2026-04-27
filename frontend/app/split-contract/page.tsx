"use client";

import { useState } from "react";
import { AlertTriangle, PieChart } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const API_BASE = getApiBaseUrl();

type SplitContractResult = {
  cjm: number;
  budget_mensuel_total: number;
  net_declare: number;
  cout_cdi: number;
  restant_b2b: number;
  detail_ir: number;
  detail_charges: number;
};

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SplitContractPage() {
  const [cjmSplit, setCjmSplit] = useState("");
  const [netDeclare, setNetDeclare] = useState("6000");
  const [splitResult, setSplitResult] =
    useState<SplitContractResult | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  const handleSplitContract = async () => {
    const cjmNum = parseFloat(cjmSplit.replace(",", "."));
    const netNum = parseInt(netDeclare, 10);

    if (Number.isNaN(cjmNum) || cjmNum <= 0) {
      setSplitError("Saisissez un CJM valide (> 0).");
      return;
    }
    if (Number.isNaN(netNum)) {
      setSplitError("Choisissez un salaire net à déclarer valide.");
      return;
    }

    setSplitError(null);
    setSplitResult(null);
    setSplitLoading(true);
    try {
      setBackendOffline(false);
      const res = await fetch(`${API_BASE}/calcul-split-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cjm: cjmNum,
          net_declare: netNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
        setSplitError(msg);
        setSplitResult(null);
        return;
      }
      setSplitResult(data as SplitContractResult);
    } catch {
      setBackendOffline(true);
      setSplitError("Serveur de calcul hors ligne.");
      setSplitResult(null);
    } finally {
      setSplitLoading(false);
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
            Déclaration Partielle &amp; Facturation B2B
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Optimisez le portage salarial de vos experts au Maroc. Ce module calcule la répartition
            financière idéale entre un contrat local sécurisé (CNSS/AMO) et une facturation
            offshore, afin de maximiser le revenu net du consultant.
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/80">
                <PieChart className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Déclaration Partielle &amp; Facturation B2B
                </h2>
                <p className="text-xs font-medium text-amber-300">
                  ⚠️ Valable uniquement au Maroc
                </p>
              </div>
            </div>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-zinc-400">
            Ce montage hybride permet de garantir une couverture sociale locale (CNSS, AMO) via un
            contrat de travail, tout en percevant le solde du budget sous forme de prestation de
            services B2B. Une approche idéale pour maximiser le revenu net.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                CJM / PRJ / Coût journalier CDI
              </label>
              <input
                type="text"
                value={cjmSplit}
                onChange={(e) => {
                  setCjmSplit(e.target.value);
                  setSplitError(null);
                }}
                placeholder="ex. 5500"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Salaire net à déclarer (CDI)
              </label>
              <select
                value={netDeclare}
                onChange={(e) => {
                  setNetDeclare(e.target.value);
                  setSplitError(null);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {["6000", "7000", "8000", "9000", "10000", "12000", "14000", "20000"].map(
                  (v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleSplitContract}
              disabled={splitLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {splitLoading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Simulation en cours…
                </>
              ) : (
                "Calculer"
              )}
            </button>
          </div>

          {splitError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{splitError}</p>
            </div>
          )}

          {splitResult && !splitError && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2 rounded-2xl border border-zinc-700/80 bg-zinc-950/80 p-4 text-sm font-mono text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    Budget mensuel (CJM × 21 jours)
                  </span>
                  <span className="text-zinc-100">
                    {formatEuro(splitResult.budget_mensuel_total)} MAD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Coût total de la déclaration CDI</span>
                  <span className="text-zinc-100">
                    {formatEuro(splitResult.cout_cdi)} MAD
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-4 text-xs text-zinc-300">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Détails de la paie locale (Pour info)
                </p>
                <div className="flex items-center justify-between">
                  <span>Impôt sur le Revenu (IR)</span>
                  <span className="font-mono text-[13px]">
                    {formatEuro(splitResult.detail_ir)} MAD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Charges sociales (CNSS / AMO)</span>
                  <span className="font-mono text-[13px]">
                    {formatEuro(splitResult.detail_charges)} MAD
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-700/70 bg-emerald-950/40 p-4 text-sm text-emerald-100">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Restant à verser (B2B offshore)
                </p>
                <p className="mt-2 text-2xl font-bold sm:text-3xl">
                  {formatEuro(splitResult.restant_b2b)} MAD
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

