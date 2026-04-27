const fs = require('fs');
const path = 'frontend/app/sprint-rh/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix infinite loading
content = content.replace(
  `const data = await res.json();
      setSemaines(data);
      if (data.length > 0 && !currentSemaineId) {
        setCurrentSemaineId(data[0].id);
      } else if (data.length === 0) {
        setLoading(false);
      }`,
  `const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("API Error:", data);
        setSemaines([]);
        setLoading(false);
        return;
      }
      setSemaines(data);
      if (data.length > 0 && !currentSemaineId) {
        setCurrentSemaineId(data[0].id);
      } else {
        setLoading(false);
      }`
);

// Also apply the user's requested KPI edits that were denied before
content = content.replace(
  `{/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-blue-400 mb-1">Besoins actifs</p>
          <p className="text-3xl font-bold text-blue-300">{kpiData?.global?.besoins_actifs || 0}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-emerald-400 mb-1">Hirings</p>
          <p className="text-3xl font-bold text-emerald-300">{kpiData?.global?.hirings || 0}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-blue-400 mb-1">Profils envoyés</p>
          <p className="text-3xl font-bold text-blue-300">{kpiData?.global?.profils_envoyes || 0}</p>
        </div>
      </div>`,
  `{/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-blue-400 mb-1">Besoins actifs</p>
          <p className="text-3xl font-bold text-blue-300">{kpiData?.global?.besoins_actifs || 0}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-amber-400 mb-1">Sourcés (Recrut)</p>
          <p className="text-3xl font-bold text-amber-300">{kpiData?.global?.profils_sources_recrut || 0}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-blue-400 mb-1">Envoyés (Biz)</p>
          <p className="text-3xl font-bold text-blue-300">{kpiData?.global?.profils_envoyes_biz || 0}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-emerald-400 mb-1">Hirings</p>
          <p className="text-3xl font-bold text-emerald-300">{kpiData?.global?.hirings || 0}</p>
        </div>
      </div>`
);

content = content.replace(
  `{/* KPIs by Recruiter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(kpiData?.par_recruteur || {}).map((rec) => {
          const stats = kpiData.par_recruteur[rec];
          return (
            <div key={rec} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <h3 className="font-semibold text-zinc-200 mb-3">{rec}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Profils envoyés</span>
                <span className="font-bold text-white">{stats.profils_envoyes}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-400">Hirings</span>
                <span className="font-bold text-emerald-400">{stats.hirings}</span>
              </div>
            </div>
          );
        })}
      </div>`,
  `{/* KPIs by Recruiter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(kpiData?.par_recruteur || {}).map((rec) => {
          const stats = kpiData.par_recruteur[rec];
          return (
            <div key={rec} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <h3 className="font-semibold text-zinc-200 mb-3">{rec}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Profils Sourcés</span>
                <span className="font-bold text-amber-400">{stats.sourcés || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-400">Envoyés au Client</span>
                <span className="font-bold text-blue-400">{stats.envoyés_biz || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-400">Hirings</span>
                <span className="font-bold text-emerald-400">{stats.hirings || 0}</span>
              </div>
            </div>
          );
        })}
      </div>`
);

fs.writeFileSync(path, content);
console.log("Patched!");
