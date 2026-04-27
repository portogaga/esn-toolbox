"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LayoutDashboard, Calendar, CheckSquare, Clock, HelpCircle, Settings, FileText, Briefcase, Users } from "lucide-react";

export default function SprintRHLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", href: "/sprint-rh/dashboard", icon: LayoutDashboard },
    { name: "Business", href: "/sprint-rh/business", icon: Briefcase },
    { name: "Recrutement", href: "/sprint-rh/recrutement", icon: Users },
    { name: "Planning", href: "/sprint-rh/sprint", icon: Calendar },
    { name: "Daily", href: "/sprint-rh/daily", icon: Clock },
    { name: "Weekly", href: "/sprint-rh/weekly", icon: CheckSquare },
    { name: "Sans Feedback", href: "/sprint-rh/sans-feedback", icon: HelpCircle },
    { name: "Récap", href: "/sprint-rh/recap", icon: FileText },
    { name: "Équipe", href: "/sprint-rh/settings", icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Pilotage RH</p>
              <h1 className="text-lg font-semibold text-zinc-100 sm:text-xl">Sprint RH Workspace</h1>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <a
                key={tab.name}
                href={tab.href}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-sky-400/40 bg-sky-500/10 text-sky-300"
                    : "border-white/10 bg-zinc-900/70 text-zinc-400 hover:border-white/20 hover:bg-zinc-800/80 hover:text-zinc-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-300" : "text-zinc-500"}`} />
                {tab.name}
              </a>
            );
          })}
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
