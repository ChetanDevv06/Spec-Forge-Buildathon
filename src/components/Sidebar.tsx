import React from "react";
import type { NavPath, UserProfile, UserRole } from "../types";
import { USER_PROFILES } from "../types";

interface SidebarProps {
  currentPath: NavPath;
  onNavigate: (path: NavPath) => void;
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  onRoleChange,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  return (
    <aside className="w-[240px] shrink-0 bg-gradient-to-b from-[#DCF6F7] to-[#D5F2EB] p-4 flex flex-col justify-between border-r border-[#cbebe3] select-none h-full overflow-y-auto">
      <div className="space-y-5">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center space-x-2.5 pl-1 cursor-pointer"
          onClick={() => onNavigate("workspace-overview")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-sky-400 to-teal-300 flex items-center justify-center shadow-sm text-white">
            <span className="material-symbols-outlined text-[20px]">architecture</span>
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-800 tracking-tight leading-tight">
              SpecForge
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              Course Studio
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500/80 mb-1">
            Curriculum Core
          </div>
          <nav aria-label="Main Navigation" className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => onNavigate("workspace-overview")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "workspace-overview"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  dashboard
                </span>
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => onNavigate("course-matrix")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "course-matrix"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  grid_view
                </span>
                <span>Course Matrix</span>
              </span>
              <span className="bg-white/80 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-slate-600">
                11
              </span>
            </button>

            <button
              onClick={() => onNavigate("curriculum-log")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "curriculum-log"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  history_edu
                </span>
                <span>Curriculum Log</span>
              </span>
            </button>

            <button
              onClick={() => onNavigate("create-specification")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "create-specification" ||
                currentPath === "extracted-content" ||
                currentPath === "specification-editor" ||
                currentPath === "copo-mapping" ||
                currentPath === "validation-inspector" ||
                currentPath === "preview-export"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  upload_file
                </span>
                <span>Create Spec</span>
              </span>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                Active
              </span>
            </button>

            <button
              onClick={() => onNavigate("regulations-and-help")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "regulations-and-help"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  verified
                </span>
                <span>Regulations & Guide</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Review & Governance Links */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500/80 mb-1">
            Review & Governance
          </div>
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => onNavigate("reviewer-queue")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "reviewer-queue"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  rate_review
                </span>
                <span>Reviewer Queue</span>
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                3
              </span>
            </button>

            <button
              onClick={() => onNavigate("hod-queue")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                currentPath === "hod-queue"
                  ? "bg-white text-slate-900 shadow-card font-bold border border-white/70"
                  : "text-slate-700 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-600">
                  verified_user
                </span>
                <span>HOD Approvals</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                1
              </span>
            </button>
          </nav>
        </div>

        {/* Faculties / Departments */}
        <div className="space-y-1 pt-1">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500/80">
            Faculties
          </div>
          <div className="space-y-0.5 text-xs font-medium text-slate-600">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/40 cursor-default">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                <span>Computer Science</span>
              </span>
              <span className="bg-white/80 text-[10px] font-semibold px-1.5 py-0.2 rounded-full text-slate-600">
                24
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/40 cursor-default">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                <span>Data Engineering</span>
              </span>
              <span className="bg-white/80 text-[10px] font-semibold px-1.5 py-0.2 rounded-full text-slate-600">
                18
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/40 cursor-default">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                <span>AI & Robotics</span>
              </span>
              <span className="bg-white/80 text-[10px] font-semibold px-1.5 py-0.2 rounded-full text-slate-600">
                12
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/40 cursor-default">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                <span>Cyber Security</span>
              </span>
              <span className="bg-white/80 text-[10px] font-semibold px-1.5 py-0.2 rounded-full text-slate-600">
                9
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Profile & Switcher Footer */}
      <div className="pt-3 border-t border-teal-200/60 relative">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 shadow-subtle border border-white/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full ${currentUser.avatarBg} ${currentUser.avatarText} text-[10px] font-bold flex items-center justify-center shrink-0 border`}
              >
                {currentUser.initials}
              </div>
              <div className="leading-tight truncate">
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-slate-500 truncate">{currentUser.roleTitle}</div>
              </div>
            </div>

            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 flex items-center gap-0.5"
              title="Switch user role for workflow testing"
            >
              <span>Role</span>
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            </button>
          </div>

          {/* Role selector dropdown */}
          {roleMenuOpen && (
            <div className="absolute bottom-16 left-2 right-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Select Active Role:
              </div>
              {(["author", "reviewer", "hod"] as UserRole[]).map((r) => {
                const p = USER_PROFILES[r];
                const active = currentUser.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleChange(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs transition ${
                      active
                        ? "bg-indigo-50 text-indigo-900 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full ${p.avatarBg} ${p.avatarText} text-[9px] font-bold flex items-center justify-center border`}
                    >
                      {p.initials}
                    </span>
                    <div className="leading-tight">
                      <div className="text-[11px] font-semibold">{p.name}</div>
                      <div className="text-[9px] text-slate-500">{p.roleTitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
