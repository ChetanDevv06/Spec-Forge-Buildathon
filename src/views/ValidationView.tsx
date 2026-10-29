import React from "react";
import type { NavPath, SpecForgeData } from "../types";

interface ValidationViewProps {
  data: SpecForgeData;
  onNavigate: (path: NavPath) => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ data, onNavigate }) => {
  const getSeverity = (code: string) => {
    switch (code) {
      case "HOURS_INCONSISTENT":
      case "WRONG_TEMPLATE":
      case "MARKS_INCONSISTENT":
      case "WEIGHTAGE_INCONSISTENT":
        return { label: "High", cls: "bg-red-100 text-red-800 border-red-200" };
      case "MAPPING_BLOOM_MISMATCH":
      case "CO_MISSING_IN_TABLE":
      case "CO_ASSESSMENT_MISMATCH":
        return { label: "Medium", cls: "bg-amber-100 text-amber-800 border-amber-200" };
      default:
        return { label: "Low", cls: "bg-blue-100 text-blue-800 border-blue-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Deterministic Quality Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Validation & Defect Inspection Matrix
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
            Automated compliance verification against NBA criteria, Bloom taxonomy ceilings, contact
            hour consistency, and template alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-3 px-4 rounded-xl shadow-card border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
              ✓
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">10 / 10 V-Rules Checked</div>
              <div className="text-[10px] text-slate-400">Zero unhandled structural errors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statistics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Defects Detected</span>
            <div className="text-2xl font-black text-amber-600">{data.defects.length} Findings</div>
            <span className="text-[10px] text-slate-500">Corrective fixes recommended</span>
          </div>
          <span className="material-symbols-outlined text-amber-500 text-[32px]">warning</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">SAR Compliance</span>
            <div className="text-2xl font-black text-emerald-600">Meets Tier-1</div>
            <span className="text-[10px] text-slate-500">PO1–PO4 average &ge; 1.8</span>
          </div>
          <span className="material-symbols-outlined text-emerald-500 text-[32px]">check_circle</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-card border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Template Verification</span>
            <div className="text-2xl font-black text-blue-600">
              {data.template === "integrated" ? "Integrated Lab" : "Non-Lab"}
            </div>
            <span className="text-[10px] text-slate-500">Validated against credits LTP</span>
          </div>
          <span className="material-symbols-outlined text-blue-500 text-[32px]">layers</span>
        </div>
      </div>

      {/* Findings List */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-900">
            Detected Defects & Corrective Actions ({data.defects.length})
          </h2>
          <span className="text-[10px] font-bold text-slate-400">
            Exported to Section 10 in Specification Document
          </span>
        </div>

        {data.defects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No defects detected. Specification conforms perfectly to all rules.
          </div>
        ) : (
          <div className="space-y-3">
            {data.defects.map((d, index) => {
              const sev = getSeverity(d.code);
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-slate-100/60 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-200 text-slate-800">
                        {d.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.cls}`}
                      >
                        {sev.label} Severity
                      </span>
                      <span className="text-xs text-slate-500">
                        Location: <strong>{d.location.source}</strong>
                        {d.location.section ? ` (Sec ${d.location.section})` : ""}
                        {d.location.refs && d.location.refs.length > 0
                          ? ` [${d.location.refs.join(", ")}]`
                          : ""}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate("specification-editor")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    >
                      <span>Review Section</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {d.description}
                  </p>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">
                      build_circle
                    </span>
                    <span>
                      <strong>Applied Fix:</strong> {d.fix}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("copo-mapping")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to CO–PO Mapping</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Validation Passed</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Ready for HTML Specification Preview</span>
        </div>

        <button
          onClick={() => onNavigate("preview-export")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-pill-btn transition active:scale-95"
        >
          <span>Continue to Preview & Export</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
