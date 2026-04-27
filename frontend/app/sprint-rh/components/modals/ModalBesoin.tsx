"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

export default function ModalBesoin({ isOpen, onClose, onSuccess, currentSemaineId, existingClients, existingBizOwners }: any) {
  const [poste, setPoste] = useState("");
  const [client, setClient] = useState("");
  const [newClient, setNewClient] = useState("");
  const [bizOwner, setBizOwner] = useState("");
  const [newBizOwner, setNewBizOwner] = useState("");
  const [priorite, setPriorite] = useState("P1");
  const [deadline, setDeadline] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const finalClient = client === "new" ? newClient : client;
    const finalBizOwner = bizOwner === "new" ? newBizOwner : bizOwner;

    if (!poste || !finalClient || !finalBizOwner || !priorite) return;

    try {
      const res = await fetch(apiUrl("/sprint-rh/besoins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semaine_id: currentSemaineId,
          poste,
          client: finalClient,
          biz_owner: finalBizOwner,
          priorite,
          deadline: deadline || undefined,
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
            <h2 className="text-lg font-bold text-white">Nouveau Besoin</h2>
            <p className="text-sm text-zinc-400">Déclarer un nouveau besoin client</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Poste *</label>
            <input required value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Client *</label>
            <select required value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="">Sélectionner</option>
              {existingClients.map((c: string) => <option key={c} value={c}>{c}</option>)}
              <option value="new">+ Nouveau client</option>
            </select>
            {client === "new" && (
              <input required value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Nom du client" className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white mt-2" />
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Biz Owner *</label>
            <select required value={bizOwner} onChange={(e) => setBizOwner(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white">
              <option value="">Sélectionner</option>
              {existingBizOwners.map((b: string) => <option key={b} value={b}>{b}</option>)}
              <option value="new">+ Nouveau Biz Owner</option>
            </select>
            {bizOwner === "new" && (
              <input required value={newBizOwner} onChange={(e) => setNewBizOwner(e.target.value)} placeholder="Nom du Biz Owner" className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white mt-2" />
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Priorité *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPriorite("P0")} className={`flex-1 py-2 rounded text-sm ${priorite === "P0" ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-zinc-800 text-zinc-400"}`}>P0</button>
              <button type="button" onClick={() => setPriorite("P1")} className={`flex-1 py-2 rounded text-sm ${priorite === "P1" ? "bg-orange-500/20 text-orange-400 border border-orange-500/50" : "bg-zinc-800 text-zinc-400"}`}>P1</button>
              <button type="button" onClick={() => setPriorite("P2")} className={`flex-1 py-2 rounded text-sm ${priorite === "P2" ? "bg-zinc-500/20 text-zinc-300 border border-zinc-500/50" : "bg-zinc-800 text-zinc-400"}`}>P2</button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-zinc-950/60 border border-slate-800/90 p-2 rounded text-white" />
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
