import React from "react";
import type { NavPath } from "../types";

interface HeaderProps {
  onNavigate: (path: NavPath) => void;
  onOpenSettings: () => void;
  serverStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenSettings,
  serverStatus,
}) => {
  return (
    <header className="h-16 bg-[#FBF9F5] border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Pill Search Bar */}
      <div className="relative w-80 max-w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </span>
        <input
          type="text"
          placeholder="Search specification, course code CS..."
          className="w-full pl-9 pr-4 py-1.5 bg-white text-xs rounded-xl border border-slate-200/90 shadow-2xs focus:ring-2 focus:ring-indigo-400 focus:outline-none placeholder-slate-400 text-slate-700 transition"
        />
      </div>

      {/* Right Window Utilities & Actions */}
      <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-600">
        {/* Semester Tag */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-slate-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-[11px] font-bold">AY 2024-25 T2</span>
        </div>

        {/* Server Status Pill */}
        <div
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] border font-medium ${
            serverStatus === "up"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
          title="API backend status at /api/v1/health"
        >
          <span className="material-symbols-outlined text-[14px]">
            {serverStatus === "up" ? "check_circle" : "sync"}
          </span>
          <span>API: {serverStatus}</span>
        </div>

        {/* Filters */}
        <button className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-2xs">
          <span className="material-symbols-outlined text-[16px] text-slate-500">tune</span>
          <span className="hidden sm:inline">Filters</span>
        </button>

        {/* Sort by */}
        <button className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-2xs">
          <span className="material-symbols-outlined text-[16px] text-slate-500">sort</span>
          <span className="hidden sm:inline">Sort by</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          title="Configure AI API keys & models"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-600">settings</span>
          <span className="hidden md:inline">AI Settings</span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={() => onNavigate("create-specification")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-pill-btn flex items-center space-x-1.5 transition active:scale-95"
        >
          <span className="text-sm leading-none font-bold">+</span>
          <span className="tracking-tight text-xs">Create Specification</span>
        </button>
      </div>
    </header>
  );
};
