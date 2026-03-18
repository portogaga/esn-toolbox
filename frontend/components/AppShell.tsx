"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:hidden">
      <Link
        href="/"
        className="cursor-pointer font-extrabold tracking-tight text-2xl transition-opacity hover:opacity-80"
      >
        <span className="text-zinc-100">esntools</span>
        <span className="text-cyan-400">.app</span>
      </Link>
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
    <div className="flex min-h-screen flex-col md:flex-row">
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
