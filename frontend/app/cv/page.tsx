"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { AlertTriangle, FileText, Upload } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API_URL = `${API_BASE.replace(/\/$/, "")}/extract-cv`;

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

export default function CvGeneratorPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fichePoste, setFichePoste] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
    if (!file || loading) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fiche_poste", fichePoste);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await readErrorMessage(response);
        throw new Error(msg);
      }

      const blob = await response.blob();

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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur inattendue s’est produite.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Accueil
          </Link>
          <Link
            href="/radar-talents"
            className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            Radar à Talents
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Maltemisation des CV Automatique
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-400">
            Déposez un PDF de CV brut : extraction IA et document Word structuré au format
            attendu par vos équipes.
          </p>
        </div>

        <section className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
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
              disabled={loading}
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

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleGenerate}
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner />
                  Génération en cours…
                </>
              ) : (
                "Générer le CV Maltem à Word"
              )}
            </button>
          </div>

          {loading && (
            <p className="mt-4 text-center text-xs text-zinc-500">
              Extraction du texte, analyse IA et rendu Word — merci de patienter.
            </p>
          )}

          <p className="mt-8 border-t border-zinc-800 pt-6 text-center text-[11px] text-zinc-500">
            Endpoint :{" "}
            <code className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 font-mono text-zinc-400">
              {API_URL}
            </code>
          </p>
        </section>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
