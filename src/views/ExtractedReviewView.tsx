import React, { useState } from "react";
import type { NavPath, SpecForgeData } from "../types";

interface ExtractedReviewViewProps {
  data: SpecForgeData;
  onNavigate: (path: NavPath) => void;
  onUpdateCo: (coId: string, statement: string, bloomLevel: number) => void;
}

export const ExtractedReviewView: React.FC<ExtractedReviewViewProps> = ({
  data,
  onNavigate,
  onUpdateCo,
}) => {
  const [resolvedCo4, setResolvedCo4] = useState(false);

  const bloomBadge = (lvl: number) => {
    switch (lvl) {
      case 1:
        return { label: "L1 Remember", cls: "bg-slate-100 text-slate-700" };
      case 2:
        return { label: "L2 Understand", cls: "bg-blue-100 text-blue-800" };
      case 3:
        return { label: "L3 Apply", cls: "bg-teal-100 text-teal-800" };
      case 4:
        return { label: "L4 Analyze", cls: "bg-indigo-100 text-indigo-800" };
      case 5:
        return { label: "L5 Evaluate", cls: "bg-purple-100 text-purple-800" };
      case 6:
        return { label: "L6 Create", cls: "bg-rose-100 text-rose-800" };
      default:
        return { label: `L${lvl}`, cls: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span>Extraction Audit & Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Review Extracted Course Data
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl mt-0.5">
            Verify parsed syllabus entities, Bloom's taxonomy mapping, and source confidence indices
            before committing to the formal institutional specification editor.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigate("copo-mapping")}
            className="flex items-center gap-1.5 bg-white text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-card border border-slate-200/80 hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-[16px] text-teal-600">analytics</span>
            <span>Confidence Matrix</span>
          </button>
        </div>
      </div>

      {/* File Summary & Confidence Metric Banner */}
      <div className="w-full bg-gradient-to-r from-slate-50 via-indigo-50/30 to-teal-50/40 rounded-2xl p-4 shadow-card border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <span className="material-symbols-outlined text-[26px]">description</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{data.course.code} Course Spec</span>
                <span className="px-2 py-0.5 rounded bg-white text-blue-700 font-mono text-[10px] font-bold border border-slate-200">
                  Verified Hash #88a1d
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 text-xs mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">timer</span> Parsed in 1.4s
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">pages</span> 8 Source Pages
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">token</span> 3,420 Extracted Tokens
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="flex items-center gap-5 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-subtle border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Confidence</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-blue-600 tracking-tight">94.2%</span>
                <span className="text-[10px] font-bold text-teal-600">Optimal</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">OBE Match</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-purple-600 tracking-tight">Tier-1 NBA</span>
                <span className="text-[10px] font-bold text-emerald-600">100%</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Audit Flags</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-600 tracking-tight">
                  {resolvedCo4 ? "0" : "1"} Notice
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {resolvedCo4 ? "Resolved" : "Verb Check"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity & Outcomes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Panel 1: Course Identity & Credit Architecture */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Course Identity & Credit Architecture
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Parsed standard header and statutory structure
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> 99.1% Confidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Course Code</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-sm text-slate-900">{data.course.code}</span>
                  <span className="material-symbols-outlined text-[16px] text-teal-600">lock</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Matched to Institute Catalog
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Course Title</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {data.course.title}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-teal-600">check</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Official Name Normalization applied
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Credit Allocation (L-T-P)
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    L:T:P = {data.course.credits_ltp}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-white p-2 rounded-lg text-center border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Lecture (L)</span>
                    <span className="font-black text-sm text-slate-900">
                      {data.course.credits_ltp.split(":")[0] || "3"} hrs
                    </span>
                    <span className="text-[9px] text-slate-500 block">3.0 Credits</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tutorial (T)</span>
                    <span className="font-black text-sm text-slate-900">
                      {data.course.credits_ltp.split(":")[1] || "0"} hrs
                    </span>
                    <span className="text-[9px] text-slate-500 block">0.0 Credits</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg text-center border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Practical (P)</span>
                    <span className="font-black text-sm text-slate-900">
                      {data.course.credits_ltp.split(":")[2] || "2"} hrs
                    </span>
                    <span className="text-[9px] text-slate-500 block">1.0 Credit</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                <span className="font-bold text-xs text-slate-900 block mt-1">
                  {data.course.department}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">School of Computing</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Framework</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-xs">
                    Tier-1 NBA 2023 OBE
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  AICTE Model Curriculum aligned
                </span>
              </div>
            </div>
          </div>

          {/* Panel 2: Course Outcomes Formulation */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
                  <span className="material-symbols-outlined text-[18px]">target</span>
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Course Outcomes Formulation ({data.course_outcomes.length} COs)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Cognitive mapping against revised Bloom's taxonomy
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                  resolvedCo4
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {resolvedCo4 ? "check" : "warning"}
                </span>
                {resolvedCo4 ? "All Verbs Aligned" : "1 Review Needed"}
              </span>
            </div>

            {/* List of COs */}
            <div className="space-y-3">
              {data.course_outcomes.map((co, index) => {
                const badge = bloomBadge(co.bloom_level);
                const isCo4 = co.id === "CO-4" || index === 3;

                return (
                  <div
                    key={co.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-xs shrink-0">
                          {co.id}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {co.statement}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">bookmark</span>
                              Section 1.{index + 1}, Page {index + 1}
                            </span>
                            <span className="text-teal-600 font-medium">Confidence: 96%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Actionable Verb Resolution Banner on CO4 */}
                    {isCo4 && !resolvedCo4 && (
                      <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-amber-900">
                          <span className="material-symbols-outlined text-[16px] text-amber-700">
                            psychology_alt
                          </span>
                          <span>
                            Recommended OBE verb: <strong>L4 Analyze</strong> (Replace passive verb 'Understand')
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onUpdateCo(
                                co.id,
                                "Analyze memory footprints of graph traversal and evaluate spanning heuristics for routing.",
                                4
                              );
                              setResolvedCo4(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-2xs"
                          >
                            Accept L4 'Analyze'
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Curricular Units (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[18px]">view_timeline</span>
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Curricular Units ({data.units.length} Modules)
                  </h2>
                  <p className="text-[11px] text-slate-500">Contact hours & practical pairings</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-xs text-blue-600">45L + 26P</span>
                <span className="block text-[9px] text-slate-400">71 Total Contact Hrs</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.units.map((u) => (
                <div
                  key={u.number}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-900">
                      UNIT {u.number} • {u.title}
                    </span>
                    <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      9L + 5P
                    </span>
                  </div>
                  {u.lab && (
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      <strong className="text-slate-700 font-semibold">Lab:</strong> {u.lab}
                    </p>
                  )}
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden mt-1">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${u.number * 20}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("create-specification")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Upload</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Extraction Validated</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Ready for Specification Editor</span>
        </div>

        <button
          onClick={() => onNavigate("specification-editor")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-pill-btn transition active:scale-95"
        >
          <span>Confirm & Continue to Specification Editor</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
