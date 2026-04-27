"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function ModalProfil({ isOpen, onClose, onSuccess, currentSemaineId, besoins }: any) {
  const [recruteur, setRecruteur] = useState("Adam");
  const [candidat, setCandidat] = useState("");
  const [besoinId, setBesoinId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!candidat || !besoinId) return;

    try {
      const res = await fetch(apiUrl("/sprint-rh/profils"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          besoin_id: besoinId,
          recruteur,
          candidat,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl shadow-2xl shadow-black/30 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800/90">
          <div>
            <h2 className="text-lg font-bold text-white">Profil Envoyé</h2>
            <p className="text-sm text-zinc-400">Soumettre un profil client</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Recruteur</label>
            <select value={recruteur} onChange={(e) => setRecruteur(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="Adam">Adam</option>
              <option value="Inès">Inès</option>
              <option value="Youssef">Youssef</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Candidat *</label>
            <input required value={candidat} onChange={(e) => setCandidat(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Besoin *</label>
            <select required value={besoinId} onChange={(e) => setBesoinId(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="">Sélectionner un besoin</option>
              {besoins.map((b: any) => (
                <option key={b.id} value={b.id}>{b.poste} — {b.biz_owner}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/90">
            <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">Annuler</button>
            <button type="submit" className="border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100 px-4 py-2 rounded">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
