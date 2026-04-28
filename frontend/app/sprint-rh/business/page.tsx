"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/apiBaseUrl";

type BizStatus = "envoye_client" | "ko" | "hiring";

export default function BusinessPage() {
  const [semaines, setSemaines] = useState<any[]>([]);
  const [currentSemaineId, setCurrentSemaineId] = useState<string>("");
  const [besoins, setBesoins] = useState<any[]>([]);
  const [selectedBesoinId, setSelectedBesoinId] = useState<string>("");
  const [profils, setProfils] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rdvCompte, setRdvCompte] = useState("");
  const [rdvCommercial, setRdvCommercial] = useState("Equipe Biz");
  const [rdvDate, setRdvDate] = useState("");

  const [profilBesoinId, setProfilBesoinId] = useState("");
  const [profilCandidat, setProfilCandidat] = useState("");
  const [profilRecruteur, setProfilRecruteur] = useState("Equipe Biz");
  const [updatingBesoin, setUpdatingBesoin] = useState(false);
  const [showAllBesoins, setShowAllBesoins] = useState(false);

  const [newBesoinPoste, setNewBesoinPoste] = useState("");
  const [newBesoinClient, setNewBesoinClient] = useState("");
  const [newBesoinBizOwner, setNewBesoinBizOwner] = useState("Equipe Biz");
  const [newBesoinPriorite, setNewBesoinPriorite] = useState("P1");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchSemaines = async () => {
    const res = await fetch(apiUrl("/sprint-rh/semaines"));
    const data = await res.json();
    if (Array.isArray(data)) {
      setSemaines(data);
      if (!currentSemaineId && data[0]?.id) setCurrentSemaineId(data[0].id);
    }
  };

  const fetchBesoins = async (semaineId: string) => {
    const endpoint = showAllBesoins
      ? apiUrl(`/sprint-rh/besoins?semaine_id=${semaineId}`)
      : apiUrl(`/sprint-rh/besoins/en-cours?semaine_id=${semaineId}`);
    const res = await fetch(endpoint);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : [];
    setBesoins(rows);
    if (rows.length > 0) {
      setSelectedBesoinId((prev) => prev || rows[0].id);
      setProfilBesoinId((prev) => prev || rows[0].id);
    } else {
      setSelectedBesoinId("");
      setProfilBesoinId("");
      setProfils([]);
    }
  };

  const fetchProfilsByBesoin = async (besoinId: string) => {
    if (!besoinId) {
      setProfils([]);
      return;
    }
    const res = await fetch(apiUrl(`/sprint-rh/profils/by-besoin/${besoinId}`));
    const data = await res.json();
    setProfils(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchSemaines()
      .catch(() => setLoadError("Impossible de charger les sprints (API indisponible)."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!currentSemaineId) return;
    fetchBesoins(currentSemaineId).catch(() =>
      setLoadError("Impossible de charger les besoins pour ce sprint.")
    );
  }, [currentSemaineId, showAllBesoins]);

  useEffect(() => {
    fetchProfilsByBesoin(selectedBesoinId).catch(console.error);
  }, [selectedBesoinId]);

  const selectedBesoin = useMemo(() => besoins.find((b) => b.id === selectedBesoinId), [besoins, selectedBesoinId]);

  const submitRdv = async () => {
    if (!currentSemaineId || !rdvCompte.trim()) return;
    const payload = {
      semaine_id: currentSemaineId,
      commercial: rdvCommercial || "Equipe Biz",
      compte: rdvCompte.trim(),
      date_rdv: rdvDate || null,
    };
    const res = await fetch(apiUrl("/sprint-rh/business/rdv"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setRdvCompte("");
      setRdvDate("");
      showToast("RDV ajoute");
    } else {
      showToast("Erreur lors de l'ajout du RDV");
    }
  };

  const submitProfil = async () => {
    if (!profilBesoinId || !profilCandidat.trim()) return;
    const payload = {
      besoin_id: profilBesoinId,
      recruteur: profilRecruteur || "Equipe Biz",
      candidat: profilCandidat.trim(),
      statut_validation: "attente_biz",
    };
    const res = await fetch(apiUrl("/sprint-rh/profils"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setProfilCandidat("");
      showToast("Profil ajoute");
      if (profilBesoinId === selectedBesoinId) fetchProfilsByBesoin(selectedBesoinId).catch(console.error);
    } else {
      showToast("Erreur lors de l'ajout du profil");
    }
  };

  const updateBusinessStatus = async (profilId: string, status: BizStatus) => {
    const res = await fetch(apiUrl(`/sprint-rh/profils/${profilId}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_status: status }),
    });
    if (res.ok) {
      showToast(`Statut passe a ${status}`);
      fetchProfilsByBesoin(selectedBesoinId).catch(console.error);
    } else {
      showToast("Erreur de mise a jour");
    }
  };

  const submitBesoin = async () => {
    if (!currentSemaineId || !newBesoinPoste.trim() || !newBesoinClient.trim()) return;
    const payload = {
      semaine_id: currentSemaineId,
      poste: newBesoinPoste.trim(),
      client: newBesoinClient.trim(),
      biz_owner: (newBesoinBizOwner || "Equipe Biz").trim(),
      priorite: newBesoinPriorite,
    };
    try {
      const res = await fetch(apiUrl("/sprint-rh/besoins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        showToast(txt || "Erreur ajout besoin");
        return;
      }
      setNewBesoinPoste("");
      setNewBesoinClient("");
      setNewBesoinPriorite("P1");
      showToast("Besoin ajoute");
      await fetchBesoins(currentSemaineId);
    } catch {
      showToast("Erreur reseau ajout besoin");
    }
  };

  const patchBesoin = async (payload: Record<string, string>) => {
    if (!selectedBesoinId) return;
    setUpdatingBesoin(true);
    try {
      const res = await fetch(apiUrl(`/sprint-rh/besoins/${selectedBesoinId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        showToast(text || "Erreur mise a jour besoin");
        return;
      }
      showToast("Besoin mis a jour");
      if (currentSemaineId) {
        await fetchBesoins(currentSemaineId);
      }
    } catch {
      showToast("Erreur reseau mise a jour besoin");
    } finally {
      setUpdatingBesoin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-sky-400">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {loadError && (
          <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {loadError}
          </p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-9000">Business</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Pilotage besoins et profils</h1>
            <p className="mt-2 text-sm text-zinc-600">Ajoute des RDV, ajoute des profils, puis gere leurs statuts sur chaque besoin.</p>
          </div>
          <select
            value={currentSemaineId}
            onChange={(e) => setCurrentSemaineId(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            {semaines.map((s) => (
              <option key={s.id} value={s.id}>
                Sprint {s.numero} ({s.annee})
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-zinc-9000">Ajouter un besoin</p>
          <div className="grid grid-cols-1 gap-2">
            <input
              value={newBesoinPoste}
              onChange={(e) => setNewBesoinPoste(e.target.value)}
              placeholder="Poste"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
            <input
              value={newBesoinClient}
              onChange={(e) => setNewBesoinClient(e.target.value)}
              placeholder="Client"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newBesoinBizOwner}
                onChange={(e) => setNewBesoinBizOwner(e.target.value)}
                placeholder="Biz owner"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
              />
              <select
                value={newBesoinPriorite}
                onChange={(e) => setNewBesoinPriorite(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
            </div>
          </div>
          <button
            onClick={submitBesoin}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            Ajouter besoin
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-zinc-9000">Ajouter un RDV</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={rdvCompte}
              onChange={(e) => setRdvCompte(e.target.value)}
              placeholder="Compte client"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
            <input
              value={rdvCommercial}
              onChange={(e) => setRdvCommercial(e.target.value)}
              placeholder="Commercial"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
            <input
              type="date"
              value={rdvDate}
              onChange={(e) => setRdvDate(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
          </div>
          <button
            onClick={submitRdv}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 transition hover:bg-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            Ajouter RDV
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-zinc-9000">Ajouter un profil pour un besoin</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <select
              value={profilBesoinId}
              onChange={(e) => setProfilBesoinId(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              {besoins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.poste} - {b.client}
                </option>
              ))}
            </select>
            <input
              value={profilCandidat}
              onChange={(e) => setProfilCandidat(e.target.value)}
              placeholder="Nom candidat"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
            <input
              value={profilRecruteur}
              onChange={(e) => setProfilRecruteur(e.target.value)}
              placeholder="Source (Biz/Recrut)"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            />
          </div>
          <button
            onClick={submitProfil}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20"
          >
            <Plus className="h-4 w-4" />
            Ajouter profil
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Besoins</h2>
            <button
              onClick={() => setShowAllBesoins((prev) => !prev)}
              className="rounded-lg border border-zinc-200 bg-slate-100 px-2 py-1 text-xs text-zinc-700 hover:border-zinc-300"
            >
              {showAllBesoins ? "Voir en cours" : "Voir tous"}
            </button>
          </div>
          <div className="space-y-2">
            {besoins.length === 0 && (
              <p className="text-sm text-zinc-9000">
                {showAllBesoins ? "Aucun besoin sur ce sprint." : "Aucun besoin en cours."}
              </p>
            )}
            {besoins.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBesoinId(b.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedBesoinId === b.id
                    ? "border-sky-500/60 bg-sky-500/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <p className="text-sm font-medium text-zinc-800">{b.poste}</p>
                <p className="text-xs text-zinc-9000">{b.client} · {b.statut || "nouveau"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
            <Briefcase className="h-4 w-4 text-sky-300" />
            Profils proposes {selectedBesoin ? `- ${selectedBesoin.poste}` : ""}
          </h2>

          {selectedBesoin && (
            <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-9000">Parametres du besoin</p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <select
                  value={selectedBesoin.priorite || "P1"}
                  onChange={(e) => patchBesoin({ priorite: e.target.value })}
                  disabled={updatingBesoin}
                  className="rounded-lg border border-zinc-200 bg-slate-100 px-2 py-1.5 text-xs text-zinc-800 disabled:opacity-60"
                >
                  <option value="P0">Priorite P0</option>
                  <option value="P1">Priorite P1</option>
                  <option value="P2">Priorite P2</option>
                </select>

                <select
                  value={selectedBesoin.statut || "nouveau"}
                  onChange={(e) => patchBesoin({ statut: e.target.value })}
                  disabled={updatingBesoin}
                  className="rounded-lg border border-zinc-200 bg-slate-100 px-2 py-1.5 text-xs text-zinc-800 disabled:opacity-60"
                >
                  <option value="nouveau">Statut: Nouveau</option>
                  <option value="en_cours">Statut: En cours</option>
                  <option value="feedback_attendu">Statut: Feedback attendu</option>
                  <option value="bloque">Statut: Bloque</option>
                  <option value="clos">Statut: Clos</option>
                  <option value="en_cours">Statut: Reposte (relance)</option>
                </select>

                <button
                  onClick={() => patchBesoin({ statut: "en_cours" })}
                  disabled={updatingBesoin}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 disabled:opacity-60"
                >
                  Relancer (Clos -&gt; Reposte)
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {profils.length === 0 && <p className="text-sm text-zinc-9000">Aucun profil pour ce besoin.</p>}
            {profils.map((p) => (
              <div key={p.id} className="rounded-xl border border-zinc-200 bg-white p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{p.candidat}</p>
                    <p className="text-xs text-zinc-9000">Source: {p.recruteur}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateBusinessStatus(p.id, "envoye_client")}
                      className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-xs text-sky-200"
                    >
                      Envoye au client
                    </button>
                    <button
                      onClick={() => updateBusinessStatus(p.id, "ko")}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                    >
                      KO
                    </button>
                    <button
                      onClick={() => updateBusinessStatus(p.id, "hiring")}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                    >
                      Hiring
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
