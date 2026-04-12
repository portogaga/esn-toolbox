import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "./context/CurrencyContext";
import { AppShell } from "../components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://esntools.app'),
  title: "ESN Toolbox — Simulateur de rentabilité",
  description: "Simulateur de rentabilité ESN : CJM, TJM, marge et gain par jour.",
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // On passe la redirection globale ici dans ClerkProvider
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
        >
          <header className="flex h-12 shrink-0 items-center justify-end border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6">
            {/* Si l'utilisateur n'est PAS connecté */}
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  Connexion
                </button>
              </SignInButton>
            </SignedOut>

            {/* Si l'utilisateur EST connecté */}
            <SignedIn>
              <div className="flex items-center gap-4">
                <UserButton />
              </div>
            </SignedIn>
          </header>

          <CurrencyProvider>
            <AppShell>{children}</AppShell>
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}