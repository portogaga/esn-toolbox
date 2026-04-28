"use client";

import Link from "next/link";
import {
  Activity,
  Building2,
  Briefcase,
  ChevronRight,
  FileText,
  Hourglass,
  LineChart,
  PieChart,
  Scale,
  Users,
  Zap,
} from "lucide-react";
import { useCurrency } from "./context/CurrencyContext";

const TOOLS = [
  {
    href: "/rentabilite",
    name: "Simulateur de Marge",
    description: "TJM, coûts, marge nette : pilotez votre rentabilité mission par mission.",
    icon: LineChart,
    accent: "emerald",
  },
  {
    href: "/cjm",
    name: "CJM Rapide",
    description: "Passez du salaire net annuel au coût journalier en un clic.",
    icon: Zap,
    accent: "amber",
  },
  {
    href: "/banc",
    name: "Impact Inter-contrat",
    description: "Quantifiez le coût du banc et les jours à facturer pour l’absorber.",
    icon: Hourglass,
    accent: "sky",
  },
  {
    href: "/comparateur",
    name: "CDI vs Freelance",
    description: "Comparez recrutement interne et sous-traitance sur une même mission.",
    icon: Building2,
    accent: "indigo",
  },
  {
    href: "/licenciement",
    name: "Provision Licenciement",
    description: "Indemnités, préavis, ICCP, risque Prud’homal : provisionnez au plus juste.",
    icon: Scale,
    accent: "rose",
  },
  {
    href: "/cv",
    name: "CV",
    description: "Generez des CV formates Maltem instantanement.",
    icon: FileText,
    accent: "emerald",
  },
  {
    href: "/radar-talents",
    name: "Radar Talents",
    description: "Identifiez rapidement les profils et competences cles de vos talents.",
    icon: Users,
    accent: "indigo",
  },
  {
    href: "/tace",
    name: "Pilotage TACE",
    description: "Taux d’activité facturable, CA réalisé et manque à gagner en temps réel.",
    icon: Activity,
    accent: "emerald",
  },
  {
    href: "/split-contract",
    name: "Split Contract Maroc",
    description: "CDI local + B2B offshore : optimisez le montage pour le marché marocain.",
    icon: PieChart,
    accent: "emerald",
  },
] as const;

const accentClasses: Record<string, string> = {
  emerald:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/20",
  amber:
    "bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:border-amber-400/50 group-hover:bg-amber-500/20",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/30 group-hover:border-sky-400/50 group-hover:bg-sky-500/20",
  indigo:
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:border-rose-400/50 group-hover:bg-rose-500/20",
};

export default function Home() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Sélecteur de devise */}
        <div className="mb-8 flex justify-end">
          <div className="inline-flex rounded-full border border-zinc-300 bg-white p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setCurrency("MAD")}
              className={`rounded-full px-3 py-1.5 transition ${
                currency === "MAD"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              DH MAD
            </button>
            <button
              type="button"
              onClick={() => setCurrency("EUR")}
              className={`rounded-full px-3 py-1.5 transition ${
                currency === "EUR"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              € EUR
            </button>
          </div>
        </div>

        {/* Hero */}
        <section className="mb-16 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Le Couteau Suisse du Business Developer ESN.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl">
            9 outils de precision pour piloter votre rentabilite, de Casablanca a Paris.
          </p>
        </section>

        {/* Intro brève */}
        <blockquote className="mb-20 border-l-4 border-emerald-500/60 bg-emerald-50 py-6 pl-6 pr-6 sm:pl-8">
          <p className="text-base leading-relaxed text-zinc-700 sm:text-lg">
            Pilotez vos décisions business avec des outils simples, rapides et orientés action.
          </p>
        </blockquote>

        {/* Outil principal */}
        <section className="mb-10">
          <Link
            href="/sprint-rh/dashboard"
            className="group relative block overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:p-8"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-300/60 bg-indigo-500/10 text-indigo-500">
              <Briefcase className="h-6 w-6" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Principal</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">Maltem OPS Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              Le cockpit principal pour piloter vos besoins, votre prospection et le suivi recrutement.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
              Ouvrir le dashboard
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </section>

        {/* Grille des outils */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const accent = accentClasses[tool.accent] ?? accentClasses.emerald;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-50"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition ${accent}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-black">
                  {tool.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
                  {tool.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  Ouvrir l&apos;outil
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
