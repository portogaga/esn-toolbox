"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, LineChart } from "lucide-react"; // J'ai ajouté l'icône du logo
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:hidden">
      
      {/* Nouveau design : Logo propre au lieu de esntools.app */}
      <Link
        href="/"
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
          <LineChart className="h-5 w-5" />
        </div>
        <span className="text-base font-semibold text-zinc-100">
          ESN Toolbox
        </span>
      </Link>

      {/* Menu Burger (inchangé) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-950">
      <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}