"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

const API_URL = apiUrl("/extract-cv");

function isPdfFile(file: File): boolean {
  if (!file.name.toLowerCase().endsWith(".pdf")) return false;
  const t = file.type;
  return (
    t === "application/pdf" ||
    t === "" ||
    t === "application/octet-stream"
  );
}

function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1].trim());
  const asciiMatch = header.match(/filename="?([^";\n]+)"?/i);
  if (asciiMatch) return asciiMatch[1].trim();
  return null;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { detail?: unknown };
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((item) => (typeof item === "object" && item && "msg" in item ? String((item as { msg: string }).msg) : JSON.stringify(item)))
        .join(" — ");
    }
    if (d != null) return JSON.stringify(d);
  }
  const text = await response.text().catch(() => "");
  if (text) return text.slice(0, 500);
  return response.statusText || `Erreur ${response.status}`;
}

const SIMULATED_PROGRESS_CAP = 95;
const SIMULATION_DURATION_MS = 60_000;
const SIMULATION_TICK_MS = 100;
const PROGRESS_INCREMENT =
  SIMULATED_PROGRESS_CAP / (SIMULATION_DURATION_MS / SIMULATION_TICK_MS);

function statusMessageForProgress(p: number): string {
  if (p < 20) return "Extraction des informations...";
  if (p < 50) return "Analyse et structuration par l'IA Gemini...";
  if (p < 80) return "Rédaction des missions au format ...";
  if (p < 95) return "Finalisation du document Word...";
  return "Finalisation du document Word...";
}

export default function CvGeneratorPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const progressValueRef = useRef(0);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fichePoste, setFichePoste] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [templateType, setTemplateType] = useState<"detailed" | "simplified" | "valkima">(
    "detailed"
  );

  const clearProgressSimulation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    progressValueRef.current = 0;
  }, []);

  useEffect(() => {
    return () => clearProgressSimulation();
  }, [clearProgressSimulation]);

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const assignPdf = useCallback(
    (f: File | null) => {
      setError(null);
      if (!f) {
        setFile(null);
        return;
      }
      if (!isPdfFile(f)) {
        setFile(null);
        setError("Seuls les fichiers PDF sont acceptés.");
        return;
      }
      setFile(f);
    },
    []
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    assignPdf(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    assignPdf(dropped ?? null);
  };

  const handleGenerate = async () => {
    if (!file || isGenerating) return;
    setError(null);
    clearProgressSimulation();

    setIsGenerating(true);
    progressValueRef.current = 0;
    setProgress(0);
    setStatusMessage(statusMessageForProgress(0));

    progressIntervalRef.current = setInterval(() => {
      progressValueRef.current = Math.min(
        progressValueRef.current + PROGRESS_INCREMENT,
        SIMULATED_PROGRESS_CAP
      );
      const p = progressValueRef.current;
      setProgress(p);
      setStatusMessage(statusMessageForProgress(p));
    }, SIMULATION_TICK_MS);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fiche_poste", fichePoste);
      formData.append("template_type", templateType);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await readErrorMessage(response);
        throw new Error(msg);
      }

      const blob = await response.blob();

      clearProgressSimulation();

      setProgress(100);
      setStatusMessage("Terminé !");

      const fromHeader = parseFilenameFromDisposition(
        response.headers.get("Content-Disposition")
      );
      const fallbackName = file.name.replace(/\.pdf$/i, "") || "CV";
      const downloadName =
        fromHeader ?? `Profil_Maltem_${fallbackName}.docx`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      resetTimeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage("");
        resetTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      clearProgressSimulation();
      setIsGenerating(false);
      setProgress(0);
      setStatusMessage("");
      const message =
        err instanceof Error ? err.message : "Une erreur inattendue s’est produite.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
          >
            Accueil
          </Link>
          <Link
            href="/radar-talents"
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-emerald-500/40 hover:text-emerald-700"
          >
            Radar à Talents
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Maltemisation des CV Automatique
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-600">
            Déposez un PDF de CV brut : extraction IA et document Word structuré au format
            attendu par vos équipes.
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/80">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Import &amp; génération Word
                </h2>
                <p className="text-xs text-zinc-500">
                  PDF uniquement — fiche de poste optionnelle pour orienter le contenu
                </p>
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onInputChange}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={[
              "group relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-all sm:py-14",
              dragActive
                ? "border-emerald-500 bg-emerald-950/25 shadow-inner shadow-emerald-900/20 ring-2 ring-emerald-500/25"
                : "border-zinc-700 bg-zinc-900/40 hover:border-emerald-500/50 hover:bg-zinc-900/70",
            ].join(" ")}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-950/80 transition group-hover:border-emerald-500/40 group-hover:bg-zinc-900">
              <Upload
                className="h-6 w-6 text-emerald-400 transition group-hover:text-emerald-300"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <p className="text-center text-sm font-semibold text-zinc-200">
              Glissez-déposez votre PDF ici
            </p>
            <p className="mt-1 max-w-md text-center text-xs leading-relaxed text-zinc-500">
              ou cliquez pour parcourir —{" "}
              <span className="font-medium text-emerald-400/90">PDF uniquement</span>
            </p>
          </button>

          {file && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100"
              >
                Retirer
              </button>
            </div>
          )}

          <div className="mt-6">
            <label
              htmlFor="fiche-poste"
              className="mb-2 block text-xs font-medium text-zinc-400"
            >
              Fiche de poste (optionnel) — pour orienter le CV sur une mission précise
            </label>
            <textarea
              id="fiche-poste"
              name="fiche_poste"
              rows={6}
              value={fichePoste}
              onChange={(e) => setFichePoste(e.target.value)}
              disabled={isGenerating}
              placeholder="Collez ici le descriptif de poste, l’appel d’offres ou les compétences clés attendues…"
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Laisser vide pour une extraction neutre, sans ciblage mission.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-100">Erreur</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{error}</p>
              </div>
            </div>
          )}

          <fieldset className="mt-8" disabled={isGenerating}>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Modèle Word
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                role="radio"
                aria-checked={templateType === "detailed"}
                onClick={() => setTemplateType("detailed")}
                className={[
                  "relative flex w-full flex-col rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950",
                  templateType === "detailed"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600",
                ].join(" ")}
              >
                {templateType === "detailed" && (
                  <CheckCircle2
                    className="absolute right-4 top-4 h-6 w-6 text-emerald-600"
                    aria-hidden
                  />
                )}
                <span
                  className={
                    templateType === "detailed"
                      ? "pr-10 text-base font-semibold text-zinc-900"
                      : "pr-2 text-base font-semibold text-zinc-100"
                  }
                >
                  Format Détaillé
                </span>
                <p
                  className={
                    templateType === "detailed"
                      ? "mt-2 text-sm text-zinc-700"
                      : "mt-2 text-sm text-zinc-400"
                  }
                >
                  Idéal pour profils seniors et AO.
                </p>
                <ul
                  className={
                    templateType === "detailed"
                      ? "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-800"
                      : "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-500"
                  }
                >
                  <li>Contexte &amp; Enjeux</li>
                  <li>Objectifs</li>
                  <li>Réalisations</li>
                  <li>Résultats</li>
                </ul>
              </button>
                <button
  type="button"
  role="radio"
  aria-checked={templateType === "valkima"}
  onClick={() => setTemplateType("valkima")}
  className={[
    "relative flex w-full flex-col rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950",
    templateType === "valkima"
      ? "border-emerald-500 bg-emerald-50"
      : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600",
  ].join(" ")}
>
  {templateType === "valkima" && (
    <CheckCircle2 className="absolute right-4 top-4 h-6 w-6 text-emerald-600" aria-hidden />
  )}
  <span
    className={
      templateType === "valkima"
        ? "pr-10 text-base font-semibold text-zinc-900"
        : "pr-2 text-base font-semibold text-zinc-100"
    }
  >
    Format Valkima
  </span>
  <p
    className={
      templateType === "valkima"
        ? "mt-2 text-sm text-zinc-700"
        : "mt-2 text-sm text-zinc-400"
    }
  >
    Charte Valkima pour AO (CNSS, etc.).
  </p>
  <ul
    className={
      templateType === "valkima"
        ? "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-800"
        : "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-500"
    }
  >
    <li>Tableau profil</li>
    <li>Expériences AO</li>
    <li>Diplômes &amp; certifs</li>
  </ul>
</button>
              <button
                type="button"
                role="radio"
                aria-checked={templateType === "simplified"}
                onClick={() => setTemplateType("simplified")}
                className={[
                  "relative flex w-full flex-col rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950",
                  templateType === "simplified"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600",
                ].join(" ")}
              >
                {templateType === "simplified" && (
                  <CheckCircle2
                    className="absolute right-4 top-4 h-6 w-6 text-emerald-600"
                    aria-hidden
                  />
                )}
                <span
                  className={
                    templateType === "simplified"
                      ? "pr-10 text-base font-semibold text-zinc-900"
                      : "pr-2 text-base font-semibold text-zinc-100"
                  }
                >
                  Format Simplifié
                </span>
                <p
                  className={
                    templateType === "simplified"
                      ? "mt-2 text-sm text-zinc-700"
                      : "mt-2 text-sm text-zinc-400"
                  }
                >
                  Format punchy qui va droit au but.
                </p>
                <ul
                  className={
                    templateType === "simplified"
                      ? "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-800"
                      : "mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-500"
                  }
                >
                  <li>Allégé</li>
                  <li>Rôle</li>
                  <li>Missions concrètes</li>
                  <li>Environnement</li>
                </ul>
              </button>
            </div>
          </fieldset>

          {!isGenerating ? (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={!file}
                onClick={handleGenerate}
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Générer le CV Maltem à Word
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-base font-semibold text-zinc-100">
                {statusMessage}
              </p>
              <div
                className="h-4 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/80"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de la génération"
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                ⏳ La génération du CV complet par l&apos;IA peut prendre
                quelques minutes, merci de patienter.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
