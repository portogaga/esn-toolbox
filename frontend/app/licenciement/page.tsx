"use client";

import { useState } from "react";
import { UserMinus, FileText, Scale, AlertTriangle } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const API_BASE = getApiBaseUrl();

type LicenciementResult = {
  indemnite_legale_nette: number;
  cout_preavis_total: number;
  cout_iccp_total: number;
  risque_prudhommes_max: number;
  cout_total_entreprise: number;
};

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function LicenciementPage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [salaireBrutMensuel, setSalaireBrutMensuel] = useState("");
  const [ancienneteAnnees, setAncienneteAnnees] = useState("");
  const [moisPreavis, setMoisPreavis] = useState("3");
  const [joursCpRestants, setJoursCpRestants] = useState("");
  const [licenciementAbusif, setLicenciementAbusif] = useState(false);
  const [legalCountry, setLegalCountry] = useState<"FR" | "MA">("MA");
  const [licenciementResult, setLicenciementResult] =
    useState<LicenciementResult | null>(null);
  const [licenciementLoading, setLicenciementLoading] = useState(false);
  const [licenciementError, setLicenciementError] = useState<string | null>(null);

  const handleCalculLicenciement = async () => {
    const salaireNum = parseFloat(salaireBrutMensuel.replace(",", "."));
    const ancienneteNum = parseFloat(ancienneteAnnees.replace(",", "."));
    const moisPreavisNum = parseFloat(moisPreavis.replace(",", "."));
    const moisPreavisInt = Math.max(0, Math.round(moisPreavisNum));
    const joursCpNum = parseFloat(joursCpRestants.replace(",", "."));

    if (Number.isNaN(salaireNum) || salaireNum <= 0) {
      setLicenciementError("Saisissez un salaire brut mensuel valide (> 0).");
      return;
    }
    if (Number.isNaN(ancienneteNum) || ancienneteNum < 0) {
      setLicenciementError("Saisissez une ancienneté valide (en années, ≥ 0).");
      return;
    }
    if (Number.isNaN(moisPreavisNum) || moisPreavisInt < 0) {
      setLicenciementError("Saisissez un nombre de mois de préavis valide (≥ 0).");
      return;
    }
    if (Number.isNaN(joursCpNum) || joursCpNum < 0) {
      setLicenciementError("Saisissez un solde de congés payés valide (≥ 0).");
      return;
    }

    setLicenciementError(null);
    setLicenciementResult(null);
    setLicenciementLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calcul-licenciement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaire_brut_mensuel: salaireNum,
          annees_anciennete: ancienneteNum,
          mois_preavis: moisPreavisInt,
          jours_cp_restants: joursCpNum,
          licenciement_abusif: licenciementAbusif,
          pays: legalCountry,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.msg || JSON.stringify(data.detail || "Erreur");
        setLicenciementError(msg);
        setLicenciementResult(null);
        return;
      }
      setLicenciementResult(data as LicenciementResult);
    } catch {
      setLicenciementError("Serveur de calcul hors ligne.");
      setLicenciementResult(null);
    } finally {
      setLicenciementLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Provisionnement des Risques RH
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Anticipez les coûts de sortie de vos collaborateurs. Évaluez précisément les indemnités
            légales de licenciement et provisionnez le risque prud&apos;homal selon le cadre juridique
            en vigueur.
          </p>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/80">
                <UserMinus className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Coût de Licenciement ({legalCountry === "MA" ? "Maroc" : "France"})
                </h2>
                <p className="text-xs text-zinc-500">
                  Estimation indicative basée sur l&apos;indemnité légale et le préavis chargé.
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setLegalCountry("MA")}
                className={`rounded-full px-3 py-1.5 transition ${
                  legalCountry === "MA"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                🇲🇦 Maroc
              </button>
              <button
                type="button"
                onClick={() => setLegalCountry("FR")}
                className={`rounded-full px-3 py-1.5 transition ${
                  legalCountry === "FR"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                🇫🇷 France
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Salaire Brut Mensuel
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={salaireBrutMensuel}
                onChange={(e) => {
                  setSalaireBrutMensuel(e.target.value);
                  setLicenciementError(null);
                }}
                placeholder="ex. 4000"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Ancienneté (années, ex : 2.5)
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={ancienneteAnnees}
                onChange={(e) => {
                  setAncienneteAnnees(e.target.value);
                  setLicenciementError(null);
                }}
                placeholder="ex. 3.5"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Mois de préavis
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={moisPreavis}
                onChange={(e) => {
                  setMoisPreavis(e.target.value);
                  setLicenciementError(null);
                }}
                placeholder="3"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Congés payés restants (jours)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={joursCpRestants}
                onChange={(e) => {
                  setJoursCpRestants(e.target.value);
                  setLicenciementError(null);
                }}
                placeholder="ex. 5"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleCalculLicenciement}
              disabled={licenciementLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {licenciementLoading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  Calcul en cours…
                </>
              ) : (
                "Estimer le coût"
              )}
            </button>

            <button
              type="button"
              onClick={() => setLicenciementAbusif((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition ${
                licenciementAbusif
                  ? "border-rose-500/70 bg-rose-950/40 text-rose-200"
                  : "border-zinc-700/80 bg-zinc-950/60 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full border ${
                  licenciementAbusif
                    ? "border-rose-400 bg-rose-500/50"
                    : "border-zinc-500 bg-zinc-900"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                    licenciementAbusif ? "translate-x-3" : "translate-x-0.5"
                  }`}
                />
              </span>
              <span>Provisionner le risque Prud&apos;homal</span>
            </button>

            {ancienneteAnnees &&
              parseFloat(ancienneteAnnees.replace(",", ".")) < 8 / 12 && (
                <span className="inline-flex items-center rounded-full border border-emerald-700/70 bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-300">
                  Aucune indemnité légale due (moins de 8 mois)
                </span>
              )}
          </div>

          {licenciementError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{licenciementError}</p>
            </div>
          )}

          {licenciementResult && !licenciementError && (
            <div className="mt-6 rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-5 text-sm shadow-inner shadow-black/40">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <FileText className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Facture de licenciement — simulation</span>
                </div>
                {ancienneteAnnees &&
                  parseFloat(ancienneteAnnees.replace(",", ".")) < 8 / 12 &&
                  licenciementResult.indemnite_legale_nette === 0 && (
                    <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-[11px] font-medium text-emerald-300">
                      Aucune indemnité légale due (moins de 8 mois)
                    </span>
                  )}
              </div>
              <div className="divide-y divide-zinc-800 border-y border-zinc-800 font-mono text-[13px]">
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-400">Indemnité légale (net salarié)</span>
                  <span className="text-zinc-100">
                    {formatEuro(licenciementResult.indemnite_legale_nette)} {currencySymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-400">
                    Préavis payé dispensé (charges patronales incluses)
                  </span>
                  <span className="text-zinc-100">
                    {formatEuro(licenciementResult.cout_preavis_total)} {currencySymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-400">
                    Congés payés non pris (ICCP + charges)
                  </span>
                  <span className="text-zinc-100">
                    {formatEuro(licenciementResult.cout_iccp_total)} {currencySymbol}
                  </span>
                </div>
                {licenciementResult.risque_prudhommes_max > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <Scale className="h-3.5 w-3.5 text-rose-400" />
                      <span>Risque Prud&apos;homal max (Barème Macron)</span>
                    </span>
                    <span className="text-sm font-medium text-rose-300">
                      {formatEuro(licenciementResult.risque_prudhommes_max)} {currencySymbol}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  COÛT TOTAL À PROVISIONNER
                </span>
                <span className="text-2xl font-extrabold text-rose-500 sm:text-3xl">
                  {formatEuro(licenciementResult.cout_total_entreprise)} {currencySymbol}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
