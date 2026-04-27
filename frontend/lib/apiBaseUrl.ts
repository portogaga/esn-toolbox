/**
 * URL de base unique du backend FastAPI (même variable pour tout le site).
 *
 * - Priorité : `NEXT_PUBLIC_API_URL` (recommandé)
 * - Rétrocompat : `NEXT_PUBLIC_API_BASE_URL` (Sprint RH historique) si l’ancienne seule est définie
 * - Dev sans variable : `http://127.0.0.1:8000`
 * - Prod sans variable : chaîne vide (évite d’appeler le localhost du navigateur)
 */
export function getApiBaseUrl(): string {
  const primary = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (primary) return primary.replace(/\/$/, "");
  const legacy = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (legacy) return legacy.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:8000";
  }
  return "";
}

/** Ex. `apiUrl("/sprint-rh/semaines")` */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
