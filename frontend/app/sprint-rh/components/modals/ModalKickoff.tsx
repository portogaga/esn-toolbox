"use client";
import { useState } from "react";
import { X } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export default function ModalKickoff({ isOpen, onClose, onSuccess, currentSemaineId, existingClients }: any) {
  const [consultant, setConsultant] = useState("");
  const [date, setDate] = useState("");
  const [client, setClient] = useState("");
  const [newClient, setNewClient] = useState("");
  const [recruteur, setRecruteur] = useState("Adam");

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const finalClient = client === "new" ? newClient : client;
    if (!consultant || !finalClient) return;

    try {
      const res = await fetch(apiUrl("/sprint-rh/kickoffs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semaine_id: currentSemaineId,
          consultant,
          date_demarrage: date || undefined,
          client: finalClient,
          recruteur,
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
            <h2 className="text-lg font-bold text-white">Nouveau Kickoff</h2>
            <p className="text-sm text-zinc-400">Déclarer un démarrage consultant</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Consultant *</label>
            <input required value={consultant} onChange={(e) => setConsultant(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Date démarrage</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Client *</label>
            <select required value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="">Sélectionner</option>
              {existingClients.map((c: string) => <option key={c} value={c}>{c}</option>)}
              <option value="new">+ Nouveau client</option>
            </select>
            {client === "new" && (
              <input required value={newClient} onChange={(e) => setNewClient(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white mt-2" />
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Recruteur</label>
            <select value={recruteur} onChange={(e) => setRecruteur(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="Adam">Adam</option>
              <option value="Inès">Inès</option>
              <option value="Youssef">Youssef</option>
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
