import Link from "next/link";

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-zinc-900 bg-zinc-950 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-xs text-zinc-500 md:flex-row md:justify-between md:text-left">
        <div>
          <Link
            href="/"
            className="inline-block text-lg font-extrabold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="text-zinc-100">esntools</span>
            <span className="text-cyan-400">.app</span>
          </Link>
          <p className="mt-1">© 2026 - Outils de pilotage pour ESN - DPSD Engineering</p>
        </div>
        <p className="md:flex-1 md:text-center">
          Copyrighted DPSD Engineering - Expertise Finance &amp; ESN
        </p>
        <nav className="flex gap-6" aria-label="Liens secondaires">
          <Link
            href="/methodologie"
            className="transition hover:text-zinc-300"
          >
            Méthodologie
          </Link>
          <Link
            href="/support"
            className="transition hover:text-zinc-300"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
