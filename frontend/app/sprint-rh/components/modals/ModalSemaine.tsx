"use client";
import { useState } from "react";
import { X } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function ModalSemaine({ isOpen, onClose, onSuccess }: any) {
  const currentWeek = Math.ceil(Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000)) / 7);
  
  const [numero, setNumero] = useState(currentWeek.toString());
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(apiUrl("/sprint-rh/semaines"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: parseInt(numero),
          annee: parseInt(annee),
          date_debut: dateDebut,
          date_fin: dateFin,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.detail || "Erreur lors de la création");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/30 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800/90">
          <div>
            <h2 className="text-lg font-bold text-white">Nouveau Sprint</h2>
            <p className="text-sm text-zinc-400">Créer une nouvelle semaine</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="bg-red-500/20 text-red-400 p-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Numéro (ex: 42) *</label>
              <input type="number" required value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Année *</label>
              <input type="number" required value={annee} onChange={(e) => setAnnee(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Date de début *</label>
            <input type="date" required value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Date de fin *</label>
            <input type="date" required value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/90">
            <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">Annuler</button>
            <button type="submit" className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-2 rounded">Créer le Sprint</button>
          </div>
        </form>
      </div>
    </div>
  );
}
