import React, { useState } from "react";
import type { NavPath, SpecForgeData } from "../types";
import { PO_DEFINITIONS } from "../mockData";

interface MappingViewProps {
  data: SpecForgeData;
  onNavigate: (path: NavPath) => void;
  onUpdateData: (updater: (prev: SpecForgeData) => SpecForgeData) => void;
}

export const MappingView: React.FC<MappingViewProps> = ({
  data,
  onNavigate,
  onUpdateData,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ coId: string; targetId: string }>({
    coId: data.course_outcomes[0]?.id || "CO-1",
    targetId: "PO-1",
  });

  const getCell = (coId: string, targetId: string) => {
    return data.co_po_pso_map[coId]?.[targetId] || null;
  };

  const handleCellLevelChange = (coId: string, targetId: string, newLevel: number) => {
    onUpdateData((prev) => {
      const currentMap = { ...prev.co_po_pso_map };
      const coRow = { ...(currentMap[coId] || {}) };

      if (newLevel <= 0) {
        delete coRow[targetId];
      } else {
        const existingJust = coRow[targetId]?.justification || "Contributes to outcome competency.";
        coRow[targetId] = {
          level: newLevel,
          justification: existingJust,
        };
      }

      return {
        ...prev,
        co_po_pso_map: {
          ...currentMap,
          [coId]: coRow,
        },
      };
    });
  };

  const handleJustificationChange = (coId: string, targetId: string, justification: string) => {
    onUpdateData((prev) => {
      const currentMap = { ...prev.co_po_pso_map };
      const coRow = { ...(currentMap[coId] || {}) };
      const currentLevel = coRow[targetId]?.level || 2;
      coRow[targetId] = {
        level: currentLevel,
        justification,
      };
      return {
        ...prev,
        co_po_pso_map: {
          ...currentMap,
          [coId]: coRow,
        },
      };
    });
  };

  // Compute PO averages
  const poAverages: Record<string, number> = {};
  PO_DEFINITIONS.forEach((po) => {
    let sum = 0;
    let count = 0;
    data.course_outcomes.forEach((co) => {
      const cell = data.co_po_pso_map[co.id]?.[po.key];
      if (cell && cell.level > 0) {
        sum += cell.level;
        count++;
      }
    });
    poAverages[po.key] = count > 0 ? Number((sum / count).toFixed(1)) : 0;
  });

  const activeCo = data.course_outcomes.find((c) => c.id === selectedCell.coId);
  const activeTargetDef = PO_DEFINITIONS.find((p) => p.key === selectedCell.targetId);
  const activeMapping = getCell(selectedCell.coId, selectedCell.targetId);

  // Check Bloom ceiling violation
  const isBloomCeilingAlert =
    (activeCo?.bloom_level ?? 3) < 3 && (activeMapping?.level ?? 0) === 3;

  return (
    <div className="space-y-6">
      {/* Page Header & Meta Badge Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-teal-700">
              {data.course.code} • {data.course.title}
            </span>
            <span className="bg-purple-100 px-2 py-0.5 rounded text-[11px] font-bold text-purple-800">
              Tier-1 NBA Articulation Format
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Live Audit Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            CO–PO–PSO Articulation Matrix Editor
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Map Course Outcomes against Program Outcomes (PO1–PO12) and Program Specific Outcomes
            (PSO1–PSO2) with NBA accreditation correlation values and academic justifications.
          </p>
        </div>

        {/* Scale Legend Card matching Stitch */}
        <div className="bg-white p-2.5 px-4 rounded-xl shadow-card border border-slate-200/80 flex items-center gap-4 text-xs font-semibold">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Scale:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-[#DCF6E8] text-[#0A5D36] text-[11px]">
              3
            </span>
            <span className="text-slate-700">Substantial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-[#E2F7F2] text-[#056050] text-[11px]">
              2
            </span>
            <span className="text-slate-700">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-slate-100 text-slate-600 text-[11px]">
              1
            </span>
            <span className="text-slate-700">Slight</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-slate-50 text-slate-400 text-[11px]">
              -
            </span>
            <span className="text-slate-400">None</span>
          </div>
        </div>
      </div>

      {/* Workspace Two-Pane (Matrix Grid + Contextual Inspector Panel) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Articulation Matrix Grid (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-white rounded-xl shadow-card border border-slate-200/80 overflow-hidden">
            {/* Table Toolbar */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">
                  table_chart
                </span>
                <span>
                  Target Matrix ({data.course_outcomes.length} COs × 14 Outcomes)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Click any cell to inspect and edit justification
              </span>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 text-xs font-bold border-b border-slate-200">
                    <th className="text-left px-3 py-2.5 min-w-[130px]">Course Outcomes</th>
                    {PO_DEFINITIONS.map((po) => (
                      <th
                        key={po.key}
                        className={`px-1 py-2 text-[11px] min-w-[42px] ${
                          po.key.startsWith("PSO") ? "bg-purple-50 text-purple-900" : ""
                        }`}
                        title={`${po.id}: ${po.title}`}
                      >
                        {po.id}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-[11px] bg-slate-100 min-w-[50px]">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data.course_outcomes.map((co) => {
                    let rowSum = 0;
                    let rowCount = 0;
                    return (
                      <tr key={co.id} className="hover:bg-slate-50/60 transition">
                        <td className="text-left px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-blue-600">{co.id}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800">
                              L{co.bloom_level}
                            </span>
                          </div>
                        </td>

                        {PO_DEFINITIONS.map((po) => {
                          const cell = getCell(co.id, po.key);
                          const lvl = cell?.level || 0;
                          if (lvl > 0) {
                            rowSum += lvl;
                            rowCount++;
                          }
                          const isSelected =
                            selectedCell.coId === co.id && selectedCell.targetId === po.key;

                          return (
                            <td key={po.key} className="p-1">
                              <button
                                onClick={() => setSelectedCell({ coId: co.id, targetId: po.key })}
                                className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center mx-auto transition-transform ${
                                  isSelected ? "ring-2 ring-blue-600 shadow-sm" : ""
                                } ${
                                  lvl === 3
                                    ? "bg-[#DCF6E8] text-[#0A5D36]"
                                    : lvl === 2
                                    ? "bg-[#E2F7F2] text-[#056050]"
                                    : lvl === 1
                                    ? "bg-slate-100 text-slate-700"
                                    : "text-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {lvl > 0 ? lvl : "-"}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2 bg-slate-50 font-bold text-slate-800 text-[11px]">
                          {rowCount > 0 ? (rowSum / rowCount).toFixed(1) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800 text-xs border-t-2 border-slate-200">
                    <td className="text-left px-3 py-2">PO Average</td>
                    {PO_DEFINITIONS.map((po) => (
                      <td
                        key={po.key}
                        className={`py-2 text-[11px] ${
                          po.key.startsWith("PSO") ? "text-purple-900 bg-purple-50/70" : ""
                        }`}
                      >
                        {poAverages[po.key] > 0 ? poAverages[po.key] : "-"}
                      </td>
                    ))}
                    <td className="py-2 bg-slate-200 text-slate-900 font-black">2.3</td>
                  </tr>

                  <tr className="bg-slate-50 text-[10px] text-slate-500 font-semibold border-t border-slate-200">
                    <td className="text-left px-3 py-1 text-slate-400">NBA Target (≥1.8)</td>
                    {PO_DEFINITIONS.map((po) => {
                      const avg = poAverages[po.key];
                      const meets = avg >= 1.8;
                      return (
                        <td
                          key={po.key}
                          className={`py-1 text-[9px] font-bold ${
                            avg === 0
                              ? "text-slate-300"
                              : meets
                              ? "text-emerald-700"
                              : "text-amber-600"
                          }`}
                        >
                          {avg === 0 ? "-" : meets ? "✓ Valid" : "⚠ Low"}
                        </td>
                      );
                    })}
                    <td className="py-1 text-emerald-800 font-bold">✓ Meets SAR</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Contextual Cell Inspector Panel (4 cols on xl) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                  {selectedCell.coId}
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  arrow_forward
                </span>
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                  {selectedCell.targetId}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Cell Inspector
              </span>
            </div>

            {/* Outcome Details */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Course Outcome Statement
              </label>
              <p className="text-xs text-slate-800 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                {activeCo?.statement}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                <span>Cognitive Depth:</span>
                <span className="font-bold text-blue-600">Level {activeCo?.bloom_level} (Bloom)</span>
              </div>
            </div>

            {/* Target Outcome Statement */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeTargetDef?.id}: {activeTargetDef?.title}
              </label>
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                {activeTargetDef?.desc}
              </p>
            </div>

            {/* Strength Level Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mapping Strength Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { lvl: 3, label: "3 High", cls: "bg-[#DCF6E8] text-[#0A5D36]" },
                  { lvl: 2, label: "2 Mod", cls: "bg-[#E2F7F2] text-[#056050]" },
                  { lvl: 1, label: "1 Low", cls: "bg-slate-100 text-slate-700" },
                  { lvl: 0, label: "None", cls: "bg-slate-50 text-slate-400" },
                ].map((item) => {
                  const currentLvl = activeMapping?.level || 0;
                  const isCur = currentLvl === item.lvl;
                  return (
                    <button
                      key={item.lvl}
                      onClick={() =>
                        handleCellLevelChange(selectedCell.coId, selectedCell.targetId, item.lvl)
                      }
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        isCur ? "ring-2 ring-blue-600 border-blue-600" : "border-slate-200"
                      } ${item.cls}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloom Ceiling Warning Banner */}
            {isBloomCeilingAlert && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
                  warning
                </span>
                <span>
                  <strong>Bloom Ceiling Audit:</strong> Level 3 (Substantial) mapping may be excessive for an L{activeCo?.bloom_level} outcome. Consider level 2.
                </span>
              </div>
            )}

            {/* Justification Textarea */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Academic Justification (Required for SAR)
              </label>
              <textarea
                rows={3}
                value={activeMapping?.justification || ""}
                onChange={(e) =>
                  handleJustificationChange(selectedCell.coId, selectedCell.targetId, e.target.value)
                }
                placeholder="Explain how this Course Outcome contributes to the Programme Outcome..."
                className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("specification-editor")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Specification Editor</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">All Mappings Justified</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Proceed to Quality Validation</span>
        </div>

        <button
          onClick={() => onNavigate("validation-inspector")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-pill-btn transition active:scale-95"
        >
          <span>Continue to Validation Matrix</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
