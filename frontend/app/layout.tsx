import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "./context/CurrencyContext";
import { AppShell } from "../components/AppShell";
import { AuthHeader } from "../components/AuthHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://esntools.app"),
  title: "ESN Toolbox — Simulateur de rentabilité",
  description:
    "Simulateur de rentabilité ESN : CJM, TJM, marge et gain par jour.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50`}
      >
        <ClerkProvider afterSignOutUrl="/">
          <AuthHeader />
          <CurrencyProvider>
            <AppShell>{children}</AppShell>
          </CurrencyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
