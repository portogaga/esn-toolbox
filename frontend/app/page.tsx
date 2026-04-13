"use client";

import Link from "next/link";
import {
  Activity,
  Building2,
  ChevronRight,
  FileText,
  Hourglass,
  LineChart,
  PieChart,
  Scale,
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
    href: "/cv-generator",
    name: "CV & Talents",
    description: "Generez des CV formates Maltem instantanement.",
    icon: FileText,
    accent: "emerald",
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Sélecteur de devise */}
        <div className="mb-8 flex justify-end">
          <div className="inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setCurrency("EUR")}
              className={`rounded-full px-3 py-1.5 transition ${
                currency === "EUR"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              € EUR
            </button>
            <button
              type="button"
              onClick={() => setCurrency("MAD")}
              className={`rounded-full px-3 py-1.5 transition ${
                currency === "MAD"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              DH MAD
            </button>
          </div>
        </div>

        {/* Hero */}
        <section className="mb-16 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl">
            Le Couteau Suisse du Business Developer ESN.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            8 outils de precision pour piloter votre rentabilite, de Casablanca a Paris.
          </p>
        </section>

        {/* Citation */}
        <blockquote className="mb-20 border-l-4 border-emerald-500/60 bg-zinc-900/60 py-6 pl-6 pr-6 sm:pl-8">
          <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
            La rentabilité ne se devine pas, elle se calcule. En ESN, la marge ne se fait pas
            uniquement sur un bon TJM facturé. Elle se gagne sur l&apos;ingénierie financière de
            vos contrats.
          </p>
        </blockquote>

        {/* Grille des outils */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const accent = accentClasses[tool.accent] ?? accentClasses.emerald;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-zinc-700 hover:bg-zinc-900/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition ${accent}`}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-semibold text-zinc-100 group-hover:text-white">
                  {tool.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
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
