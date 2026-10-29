import React from "react";
import type { NavPath } from "../types";

interface CurriculumLogViewProps {
  onNavigate: (path: NavPath) => void;
}

export const CurriculumLogView: React.FC<CurriculumLogViewProps> = ({ onNavigate }) => {
  const events = [
    {
      time: "10 minutes ago",
      actor: "Dr. Aris Thorne",
      action: "Saved specification edits",
      target: "CS301 — Data Structures & Algorithms",
      badge: "Edits Saved",
      badgeCls: "bg-blue-100 text-blue-800",
    },
    {
      time: "1 hour ago",
      actor: "Deterministic Engine",
      action: "Ran V1–V10 validation audit",
      target: "CS301 (Found 3 defects, applied auto-fixes)",
      badge: "Validated",
      badgeCls: "bg-emerald-100 text-emerald-800",
    },
    {
      time: "Yesterday, 4:15 PM",
      actor: "Prof. Sarah Jenkins",
      action: "Completed peer review feedback",
      target: "CS402 — Machine Learning & Neural Nets",
      badge: "Review Done",
      badgeCls: "bg-purple-100 text-purple-800",
    },
    {
      time: "28 Oct 2024",
      actor: "Dr. Marcus Vance",
      action: "Executive sign-off and accreditation archive",
      target: "CS204 — Discrete Mathematics",
      badge: "Approved",
      badgeCls: "bg-teal-100 text-teal-800",
    },
    {
      time: "25 Oct 2024",
      actor: "Dr. Aris Thorne",
      action: "Ingested source syllabus docx",
      target: "CS305 — Database Management Systems",
      badge: "Ingestion",
      badgeCls: "bg-slate-100 text-slate-800",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
          <span className="material-symbols-outlined text-[18px]">history_edu</span>
          <span>Immutable Audit Trail</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Curriculum Audit & Event Log
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
          Chronological record of all syllabus transformations, peer reviews, defect findings, and
          statutory approvals.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
        <div className="space-y-3">
          {events.map((ev, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {ev.actor}{" "}
                    <span className="font-normal text-slate-500">{ev.action} on</span>{" "}
                    <span className="text-blue-700 font-semibold">{ev.target}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{ev.time}</div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-center ${ev.badgeCls}`}>
                {ev.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
