"use client";

export default function CvGeneratorPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">CV & Talents</h1>
        <p className="mt-3 text-zinc-400">
          Espace de travail pour generer et structurer des CV au format Maltem.
        </p>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="h-64 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40" />
        </section>
      </div>
    </div>
  );
}
