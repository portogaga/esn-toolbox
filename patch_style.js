const fs = require('fs');
const glob = require('glob');

const files = glob.sync('frontend/app/sprint-rh/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Change backgrounds and borders
  content = content.replace(/bg-zinc-900/g, 'bg-slate-900/60');
  content = content.replace(/border-zinc-800/g, 'border-slate-800/90');
  content = content.replace(/bg-zinc-950/g, 'bg-zinc-950/60');
  
  // Change rounded corners
  content = content.replace(/rounded-xl/g, 'rounded-3xl shadow-2xl shadow-black/30');
  
  // Change headers to match the rentabilite page style
  content = content.replace(/text-xl font-semibold text-emerald-400/g, 'text-sm font-semibold uppercase tracking-wider text-zinc-400');
  content = content.replace(/text-2xl font-bold text-emerald-400/g, 'text-sm font-semibold uppercase tracking-wider text-zinc-400');
  content = content.replace(/text-xl font-semibold text-amber-400/g, 'text-sm font-semibold uppercase tracking-wider text-amber-400/80');

  // Change big green buttons to sleek slate buttons
  content = content.replace(/bg-emerald-600 hover:bg-emerald-500 text-white/g, 'border border-slate-600 bg-slate-800/80 text-zinc-300 hover:border-slate-500 hover:bg-slate-800 hover:text-zinc-100');
  
  // Inputs
  content = content.replace(/bg-zinc-950 border border-zinc-800 p-2 rounded text-white/g, 'w-full rounded-xl border border-slate-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30');

  fs.writeFileSync(file, content);
});
console.log("Patched styles!");
