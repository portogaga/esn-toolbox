"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  Briefcase,
  FileText,
  Gauge,
  Hourglass,
  LineChart,
  PieChart,
  Scale,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCurrency } from "../app/context/CurrencyContext";

const links = [
  { href: "/", label: "Vue d'ensemble", icon: Gauge },
  { href: "/sprint-rh/dashboard", label: "OPS Dashboard", icon: Briefcase },
  { href: "/cjm", label: "CJM Rapide", icon: Zap },
  { href: "/rentabilite", label: "Simulateur de Marge", icon: LineChart },
  { href: "/banc", label: "Impact Inter-contrat", icon: Hourglass },
  { href: "/licenciement", label: "Provision Licenciement", icon: Scale },
  { href: "/comparateur", label: "CDI vs Freelance", icon: Building2 },
  { href: "/cv", label: "CV", icon: FileText },
  { href: "/radar-talents", label: "Radar Talents", icon: Users },
  { href: "/tace", label: "Pilotage TACE", icon: Activity },
  { href: "/split-contract", label: "Split Contract", icon: PieChart },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  showMaltemBrand?: boolean;
};

export function Sidebar({ mobileOpen = false, onClose, showMaltemBrand = false }: SidebarProps) {
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();

  const linkProps = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname.startsWith(href) && href !== "/";
    return {
      className: `flex items-center gap-2 rounded-xl px-3 py-2 transition ${
        active
          ? "border border-zinc-300 bg-white text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-slate-100 hover:text-zinc-900"
      }`,
      onClick: onClose,
    };
  };

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center justify-between gap-2 px-1">
        <Link href="/" className="cursor-pointer transition-opacity hover:opacity-80">
          {showMaltemBrand ? (
            <img
              src="/maltem-africa-logo.png"
              alt="Maltem Africa"
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              esntools<span className="text-cyan-500">.app</span>
            </span>
          )}
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-slate-100 hover:text-zinc-900 md:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mb-6 px-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
          Devise
        </p>
        <div className="inline-flex rounded-full border border-zinc-300 bg-white p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setCurrency("MAD")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
              currency === "MAD"
                ? "bg-emerald-500 text-zinc-50 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>DH</span>
            <span className="hidden sm:inline">MAD</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrency("EUR")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
              currency === "EUR"
                ? "bg-indigo-500 text-zinc-50 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>€</span>
            <span className="hidden sm:inline">EUR</span>
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pt-2 text-sm">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            {...linkProps(href)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: sidebar fixe à gauche */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-5 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile: overlay quand le menu est ouvert */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm"
            aria-label="Fermer le menu"
          />
          <aside className="relative z-10 flex h-full w-64 max-w-[85vw] flex-col border-r border-zinc-200 bg-white px-4 py-5 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
