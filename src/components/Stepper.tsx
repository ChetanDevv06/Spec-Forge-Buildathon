import React from "react";
import type { NavPath } from "../types";

interface StepperProps {
  currentPath: NavPath;
  onNavigate: (path: NavPath) => void;
}

const STEPS: Array<{ path: NavPath; number: number; label: string }> = [
  { path: "create-specification", number: 1, label: "Upload Sources" },
  { path: "extracted-content", number: 2, label: "Extracted Content" },
  { path: "specification-editor", number: 3, label: "Specification Editor" },
  { path: "copo-mapping", number: 4, label: "CO–PO Mapping" },
  { path: "validation-inspector", number: 5, label: "Validation Matrix" },
  { path: "preview-export", number: 6, label: "Preview & Export" },
];

export const Stepper: React.FC<StepperProps> = ({ currentPath, onNavigate }) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-card mb-4 overflow-x-auto border border-slate-200/80">
      <div className="flex items-center gap-2 min-w-[760px]">
        {STEPS.map((s, idx) => {
          const isActive = currentPath === s.path;
          return (
            <React.Fragment key={s.path}>
              <button
                onClick={() => onNavigate(s.path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-pill-btn font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-white text-indigo-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {s.number}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>

              {idx < STEPS.length - 1 && (
                <span className="material-symbols-outlined text-slate-300 text-[18px]">
                  chevron_right
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
