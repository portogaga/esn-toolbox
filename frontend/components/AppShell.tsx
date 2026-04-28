"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

function PublicBrand() {
  return (
    <span className="text-base font-extrabold tracking-tight text-zinc-900">
      esntools<span className="text-cyan-500">.app</span>
    </span>
  );
}

function TopBar({
  onMenuClick,
  showMaltemBrand,
}: {
  onMenuClick: () => void;
  showMaltemBrand: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
      <Link
        href="/"
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        {showMaltemBrand ? (
          <img
            src="/maltem-africa-logo.png"
            alt="Maltem Africa"
            className="h-8 w-auto object-contain"
          />
        ) : (
          <PublicBrand />
        )}
      </Link>

      {/* Menu Burger (inchangé) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}

function ShellLayout({
  children,
  showMaltemBrand,
}: {
  children: React.ReactNode;
  showMaltemBrand: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-50">
      <TopBar onMenuClick={() => setMobileMenuOpen(true)} showMaltemBrand={showMaltemBrand} />
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        showMaltemBrand={showMaltemBrand}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

function ClerkAwareShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  return <ShellLayout showMaltemBrand={isLoaded && isSignedIn} children={children} />;
}

export function AppShell({
  children,
  clerkEnabled = false,
}: {
  children: React.ReactNode;
  clerkEnabled?: boolean;
}) {
  if (!clerkEnabled) return <ShellLayout showMaltemBrand={false}>{children}</ShellLayout>;
  return <ClerkAwareShell>{children}</ClerkAwareShell>;
}