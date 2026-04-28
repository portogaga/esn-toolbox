"use client";

import { useState } from "react";
import { AlertTriangle, Zap } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const API_BASE = getApiBaseUrl();

function formatEuro(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CJMPage() {
  const { currency } = useCurrency();
  const currencySymbol = currency === "EUR" ? "€" : "DH";

  const [salaireNetMensuel, setSalaireNetMensuel] = useState("");
  const [pays, setPays] = useState<"FR" | "MA">("MA");
  const [cjmCalcule, setCjmCalcule] = useState<number | null>(null);
  const [cjmLoading, setCjmLoading] = useState(false);
  const [cjmError, setCjmError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  const handleCalculCjm = async () => {
    const raw = salaireNetMensuel.replace(",", ".");
    const mensuel = Number(parseFloat(raw));
    if (Number.isNaN(mensuel) || mensuel <= 0) {
      setCjmError("Saisissez un salaire net mensuel valide.");
      return;
    }
    const body = {
      salaire_net_mensuel: mensuel,
      pays,
    };
    console.log("Données envoyées:", body);
    setCjmError(null);
    setCjmLoading(true);
    setCjmCalcule(null);
    try {
      setBackendOffline(false);
      const res = await fetch(`${API_BASE}/calcul-cjm-rapide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((e: { msg?: string }) => e?.msg).filter(Boolean).join(", ") || "Erreur de calcul"
              : "Erreur de calcul";
        setCjmError(message);
        return;
      }
      setCjmCalcule(data.cjm_estime ?? null);
    } catch (error) {
      console.error("Erreur API:", error);
      setBackendOffline(true);
      setCjmError("Serveur de calcul hors ligne.");
    } finally {
      setCjmLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {backendOffline && (
          <p
            className="mb-6 rounded-xl border border-amber-900/60 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-700"
            role="status"
          >
            Serveur de calcul hors ligne.
          </p>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Évaluation Express du Coût Journalier
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-600">
            Estimez rapidement le Coût Journalier Moyen (PRJ) d&apos;un profil à partir de ses
            prétentions salariales nettes. Un indicateur clé pour valider instantanément la
            faisabilité financière d&apos;un placement client.
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-600">
            <Zap className="h-4 w-4 text-amber-400" />
            Calculateur de CJM rapide
          </h2>
          <p className="mb-4 text-sm text-zinc-9000">
            Saisissez votre salaire net mensuel pour obtenir une estimation du
            CJM. Basé sur une estimation du coût total employeur divisé par 20
            jours de production mensuelle.
          </p>

          <div className="mb-5 inline-flex rounded-full border border-zinc-700/80 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPays("MA")}
              className={`rounded-full px-3 py-1.5 transition ${
                pays === "MA"
                  ? "border border-cyan-400 bg-cyan-500/10 text-cyan-300"
                  : "border border-transparent text-zinc-600 hover:text-zinc-800"
              }`}
            >
              🇲🇦 Maroc
            </button>
            <button
              type="button"
              onClick={() => setPays("FR")}
              className={`rounded-full px-3 py-1.5 transition ${
                pays === "FR"
                  ? "border border-cyan-400 bg-cyan-500/10 text-cyan-300"
                  : "border border-transparent text-zinc-600 hover:text-zinc-800"
              }`}
            >
              🇫🇷 France
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-xs font-medium text-zinc-600">
                Salaire net mensuel
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={salaireNetMensuel}
                onChange={(e) => {
                  setSalaireNetMensuel(e.target.value);
                  setCjmError(null);
                }}
                placeholder="ex. 2500"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-800 placeholder:text-zinc-9000 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <button
              type="button"
              onClick={handleCalculCjm}
              disabled={cjmLoading}
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-amber-500 disabled:opacity-50"
            >
              {cjmLoading ? "Calcul…" : "Calculer le CJM"}
            </button>
          </div>
          {cjmError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-300" role="alert">
              <AlertTriangle className="h-4 w-4" />
              <span>{cjmError}</span>
            </p>
          )}
          {cjmCalcule !== null && !cjmError && (
            <div className="mt-4 rounded-xl border border-zinc-300/80 bg-zinc-950/60 px-4 py-3">
              <span className="text-xs text-zinc-9000">CJM estimé : </span>
              <span className="text-lg font-semibold text-amber-400">
                {formatEuro(cjmCalcule)} {currencySymbol}
              </span>
              <span className="text-zinc-9000"> / jour</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

