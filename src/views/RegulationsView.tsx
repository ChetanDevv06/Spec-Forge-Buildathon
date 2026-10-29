import React from "react";
import type { NavPath } from "../types";
import { PO_DEFINITIONS } from "../mockData";

interface RegulationsViewProps {
  onNavigate: (path: NavPath) => void;
}

export const RegulationsView: React.FC<RegulationsViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Accreditation Guidelines & OBE Standards</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Regulations, PO/PSO Reference & Bloom's Guide
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
          Official statutory guidelines under Regulation 2023 for Tier-1 NBA / Washington Accord
          curriculum engineering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Bloom's Taxonomy Guide Card */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-purple-600 text-[22px]">
              psychology
            </span>
            <h2 className="font-bold text-sm text-slate-900">
              Revised Bloom's Taxonomy Cognitive Hierarchy
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            {[
              {
                lvl: "L1 Remember",
                verbs: "Recall, identify, list, define, state, recognize.",
                desc: "Retrieve relevant knowledge from long-term memory.",
                cls: "bg-slate-100 text-slate-800",
              },
              {
                lvl: "L2 Understand",
                verbs: "Explain, summarize, classify, infer, compare, illustrate.",
                desc: "Construct meaning from instructional messages and concepts.",
                cls: "bg-blue-100 text-blue-800",
              },
              {
                lvl: "L3 Apply",
                verbs: "Implement, execute, calculate, solve, demonstrate, operate.",
                desc: "Carry out or use a procedure in a given practical context.",
                cls: "bg-teal-100 text-teal-800",
              },
              {
                lvl: "L4 Analyze",
                verbs: "Differentiate, organize, attribute, decompose, profile.",
                desc: "Break material into constituent parts and determine relationships.",
                cls: "bg-indigo-100 text-indigo-800",
              },
              {
                lvl: "L5 Evaluate",
                verbs: "Check, critique, judge, defend, validate, verify.",
                desc: "Make judgments based on criteria and technical standards.",
                cls: "bg-purple-100 text-purple-800",
              },
              {
                lvl: "L6 Create",
                verbs: "Design, construct, synthesize, formulate, build, innovate.",
                desc: "Put elements together to form a novel, coherent whole.",
                cls: "bg-rose-100 text-rose-800",
              },
            ].map((b) => (
              <div key={b.lvl} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${b.cls}`}>
                    {b.lvl}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">NBA Valid</span>
                </div>
                <div className="text-slate-800 font-semibold">{b.verbs}</div>
                <div className="text-[11px] text-slate-500">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Outcomes (PO1-PO12 & PSO1-2) Reference Card */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-teal-600 text-[22px]">
              format_list_bulleted
            </span>
            <h2 className="font-bold text-sm text-slate-900">
              Statutory Program Outcomes (POs) & PSOs
            </h2>
          </div>

          <div className="space-y-2 text-xs max-h-[600px] overflow-y-auto pr-1">
            {PO_DEFINITIONS.map((po) => (
              <div key={po.key} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-xs ${
                      po.key.startsWith("PSO")
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {po.id}
                  </span>
                  <span className="font-bold text-slate-900">{po.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-1">{po.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
