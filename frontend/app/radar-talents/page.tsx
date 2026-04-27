"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { AlertTriangle, BarChart3, Upload } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

const API_SCORE_URL = apiUrl("/score-cvs");

export type ScoreResultApi = {
  nom_candidat: string;
  score_pourcentage: number;
  points_forts: string[];
  competences_manquantes: string[];
  justification_courte: string;
};

function isPdfFile(file: File): boolean {
  if (!file.name.toLowerCase().endsWith(".pdf")) return false;
  const t = file.type;
  return (
    t === "application/pdf" ||
    t === "" ||
    t === "application/octet-stream"
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { detail?: unknown };
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: string }).msg)
            : JSON.stringify(item)
        )
        .join(" — ");
    }
    if (d != null) return JSON.stringify(d);
  }
  const text = await response.text().catch(() => "");
  if (text) return text.slice(0, 500);
  return response.statusText || `Erreur ${response.status}`;
}

function fileKey(f: File): string {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

function scoreTone(score: number): {
  label: string;
  bar: string;
  badge: string;
  ring: string;
} {
  if (score > 80) {
    return {
      label: "Très bonne adéquation",
      bar: "bg-emerald-500",
      badge: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40",
      ring: "ring-emerald-500/15",
    };
  }
  if (score > 50) {
    return {
      label: "Adéquation partielle",
      bar: "bg-amber-500",
      badge: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40",
      ring: "ring-amber-500/15",
    };
  }
  return {
    label: "Écart important",
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-200 ring-1 ring-red-500/40",
    ring: "ring-red-500/15",
  };
}

export default function RadarTalentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fichePoste, setFichePoste] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoreResultApi[] | null>(null);

  const mergePdfFiles = useCallback((incoming: File[]) => {
    const pdfs = incoming.filter(isPdfFile);
    if (incoming.length && !pdfs.length) {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setError(null);
    setPdfFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of pdfs) {
        const k = fileKey(f);
        if (!seen.has(k)) {
          seen.add(k);
          next.push(f);
        }
      }
      return next;
    });
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    mergePdfFiles(list);
    e.target.value = "";
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
    const dropped = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    mergePdfFiles(dropped);
  };

  const removeFile = (key: string) => {
    setPdfFiles((prev) => prev.filter((f) => fileKey(f) !== key));
  };

  const clearPdfs = () => {
    setPdfFiles([]);
    setError(null);
  };

  const handleScore = async () => {
    if (loading) return;
    if (!fichePoste.trim()) {
      setError("Collez une fiche de poste avant de lancer le scoring.");
      return;
    }
    if (!pdfFiles.length) {
      setError("Ajoutez au moins un CV au format PDF.");
      return;
    }

    setError(null);
    setResults(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("fiche_poste", fichePoste);
      for (const f of pdfFiles) {
        formData.append("files", f);
      }

      const response = await fetch(API_SCORE_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as ScoreResultApi[];
      if (!Array.isArray(data)) {
        throw new Error("Réponse API invalide : un tableau était attendu.");
      }

      const sorted = [...data].sort(
        (a, b) => b.score_pourcentage - a.score_pourcentage
      );
      setResults(sorted);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inattendue s’est produite.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Accueil
          </Link>
          <Link
            href="/cv"
            className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            Maltemisation CV
          </Link>
        </div>

        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Scoring CV &amp; adéquation mission
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-base text-zinc-400 lg:mx-0">
            Comparez plusieurs CV à une même fiche de poste : score de fit par mission, points
            forts et écarts, classés du meilleur match au plus faible.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 space-y-0 lg:sticky lg:top-8 lg:max-w-md">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-900/80">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Fiche &amp; CVs
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Fiche de poste obligatoire — plusieurs PDF autorisés
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="radar-fiche"
                  className="mb-2 block text-xs font-medium text-zinc-400"
                >
                  Fiche de poste / besoin mission
                </label>
                <textarea
                  id="radar-fiche"
                  rows={12}
                  value={fichePoste}
                  onChange={(e) => setFichePoste(e.target.value)}
                  disabled={loading}
                  placeholder="Collez ici l’intégralité de la fiche de poste, du cahier des charges ou de l’appel d’offres…"
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-zinc-400">
                  CVs (PDF, plusieurs fichiers)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={onFileInput}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={[
                    "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition-all",
                    dragActive
                      ? "border-emerald-500 bg-emerald-950/25 shadow-inner shadow-emerald-900/20 ring-2 ring-emerald-500/25"
                      : "border-zinc-700 bg-zinc-900/40 hover:border-emerald-500/50 hover:bg-zinc-900/70",
                  ].join(" ")}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700/80 bg-zinc-950/80">
                    <Upload
                      className="h-6 w-6 text-emerald-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <span className="mt-3 text-center text-sm font-semibold text-zinc-200">
                    Glisser-déposer plusieurs PDF
                  </span>
                  <span className="mt-1 text-center text-xs text-zinc-500">
                    ou cliquer pour sélectionner —{" "}
                    <span className="font-medium text-emerald-400/90">multi-fichiers</span>
                  </span>
                </button>

                {pdfFiles.length > 0 && (
                  <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-2">
                    {pdfFiles.map((f) => (
                      <li
                        key={fileKey(f)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/80 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium text-zinc-200">
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(fileKey(f))}
                          disabled={loading}
                          className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pdfFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPdfs}
                    disabled={loading}
                    className="mt-2 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    Vider la liste des CV
                  </button>
                )}
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

              <button
                type="button"
                disabled={loading || !fichePoste.trim() || pdfFiles.length === 0}
                onClick={handleScore}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Analyse en cours…
                  </>
                ) : (
                  "Lancer le scoring IA"
                )}
              </button>

              {loading && (
                <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6">
                  <div className="relative h-14 w-14">
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500/40" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/10" />
                  </div>
                  <p className="text-center text-sm font-medium text-zinc-300">
                    Comparaison des profils à la fiche…
                  </p>
                  <p className="text-center text-xs text-zinc-500">
                    Cela peut prendre une minute selon le nombre de CV.
                  </p>
                </div>
              )}

              <p className="mt-6 border-t border-zinc-800 pt-5 text-center text-[11px] text-zinc-500">
                Endpoint :{" "}
                <code className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 font-mono text-zinc-400">
                  {API_SCORE_URL}
                </code>
              </p>
            </section>
          </aside>

          <section className="min-w-0 flex-1 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-100">
              Résultats
              {results && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  ({results.length} candidat{results.length > 1 ? "s" : ""}, tri par score
                  décroissant)
                </span>
              )}
            </h2>

            {!results && !loading && (
              <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-16 text-center text-sm text-zinc-500">
                Les cartes de scoring apparaîtront ici après l’envoi.
              </div>
            )}

            {results && results.length === 0 && (
              <p className="text-sm text-zinc-400">Aucun résultat renvoyé.</p>
            )}

            <div className="space-y-5">
              {results?.map((r, idx) => {
                const tone = scoreTone(r.score_pourcentage);
                return (
                  <article
                    key={`${r.nom_candidat}-${idx}`}
                    className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-xl ring-1 ${tone.ring}`}
                  >
                    <div className="flex flex-col gap-4 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          #{idx + 1} — Candidat
                        </p>
                        <h3 className="truncate text-xl font-bold text-zinc-50">
                          {r.nom_candidat || "Non identifié"}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">{tone.label}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-lg font-bold tabular-nums ${tone.badge}`}
                        >
                          {r.score_pourcentage}%
                        </span>
                      </div>
                    </div>

                    <div className="px-5 py-3">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${tone.bar}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, r.score_pourcentage))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 px-5 pb-5">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
                          Points forts
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(r.points_forts ?? []).length ? (
                            r.points_forts.map((p, i) => (
                              <span
                                key={`pf-${i}`}
                                className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-200"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300/90">
                          Compétences / exigences manquantes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(r.competences_manquantes ?? []).length ? (
                            r.competences_manquantes.map((p, i) => (
                              <span
                                key={`pm-${i}`}
                                className="inline-flex rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-200"
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Justification
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-300">
                          {r.justification_courte}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 shrink-0 animate-spin text-white"
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
