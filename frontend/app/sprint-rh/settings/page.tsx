"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function SettingsPage() {
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("recruteur");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchCollaborateurs = async () => {
    try {
      const res = await fetch(apiUrl("/sprint-rh/collaborateurs"));
      const data = await res.json();
      setCollaborateurs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborateurs();
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!nom) return;
    try {
      const res = await fetch(apiUrl("/sprint-rh/collaborateurs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, role }),
      });
      if (res.ok) {
        setNom("");
        setToast("Collaborateur ajouté");
        setTimeout(() => setToast(null), 3000);
        fetchCollaborateurs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce collaborateur ?")) return;
    try {
      const res = await fetch(apiUrl(`/sprint-rh/collaborateurs/${id}`), {
        method: "DELETE",
      });
      if (res.ok) {
        setToast("Collaborateur supprimé");
        setTimeout(() => setToast(null), 3000);
        fetchCollaborateurs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {toast}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Configuration</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Paramètres de l'équipe</h1>
        <p className="mt-2 text-sm text-zinc-400">Gère les membres Biz et Recrutement utilisés dans les formulaires Sprint RH.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Ajouter un Collaborateur</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nom Complet</label>
              <input required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-950/80 p-2.5 text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-950/80 p-2.5 text-white">
                <option value="recruteur">Recruteur</option>
                <option value="biz">Business Developer (Biz)</option>
              </select>
            </div>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-700/40 bg-sky-500/10 px-4 py-2.5 text-sky-200 transition hover:bg-sky-500/20">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Membres Actuels</h2>
          <div className="space-y-2">
            {collaborateurs.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
                <div>
                  <p className="text-white font-medium">{c.nom}</p>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{c.role}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {collaborateurs.length === 0 && <p className="text-zinc-500 text-sm">Aucun collaborateur.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
