import React, { useState } from "react";
import type { NavPath, SpecForgeData } from "../types";

interface EditorViewProps {
  data: SpecForgeData;
  onNavigate: (path: NavPath) => void;
  onUpdateData: (updater: (prev: SpecForgeData) => SpecForgeData) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  data,
  onNavigate,
  onUpdateData,
}) => {
  const [activeSection, setActiveSection] = useState("section-metadata");

  const handleUpdateCourseTitle = (title: string) => {
    onUpdateData((prev) => ({
      ...prev,
      course: { ...prev.course, title },
    }));
  };

  const handleUpdateCourseCode = (code: string) => {
    onUpdateData((prev) => ({
      ...prev,
      course: { ...prev.course, code },
    }));
  };

  const handleUpdateCoStatement = (coId: string, statement: string) => {
    onUpdateData((prev) => ({
      ...prev,
      course_outcomes: prev.course_outcomes.map((c) =>
        c.id === coId ? { ...c, statement } : c
      ),
    }));
  };

  const handleUpdateCoBloom = (coId: string, bloom_level: number) => {
    onUpdateData((prev) => ({
      ...prev,
      course_outcomes: prev.course_outcomes.map((c) =>
        c.id === coId ? { ...c, bloom_level } : c
      ),
    }));
  };

  const handleAddNewCo = () => {
    const nextNum = data.course_outcomes.length + 1;
    const newCo = {
      id: `CO-${nextNum}`,
      statement: "Formulate and apply appropriate algorithmic models to solve computational problems.",
      bloom_level: 3,
    };
    onUpdateData((prev) => ({
      ...prev,
      course_outcomes: [...prev.course_outcomes, newCo],
      co_po_pso_map: {
        ...prev.co_po_pso_map,
        [newCo.id]: {
          "PO-1": { level: 2, justification: "Engineering fundamentals application." },
        },
      },
    }));
  };

  const handleDeleteCo = (coId: string) => {
    if (data.course_outcomes.length <= 1) {
      alert("At least one Course Outcome is required.");
      return;
    }
    onUpdateData((prev) => {
      const nextMap = { ...prev.co_po_pso_map };
      delete nextMap[coId];
      return {
        ...prev,
        course_outcomes: prev.course_outcomes.filter((c) => c.id !== coId),
        co_po_pso_map: nextMap,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Autosave & Session Status Banner */}
      <div className="bg-white rounded-xl p-3 px-4 shadow-card border border-slate-200/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            Editing: {data.course.code} — {data.course.title}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Auto-saved to session state</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="material-symbols-outlined text-[16px] text-teal-600">verified</span>
          <span>Template: {data.template === "integrated" ? "Integrated Lab" : "Non-Lab"}</span>
        </div>
      </div>

      {/* Workspace Container (Outline Sub-Nav + Studio Canvas) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Document Outline Sub-Nav (220px Desktop Anchor) */}
        <aside className="w-full lg:w-[220px] shrink-0 sticky top-4 bg-white rounded-xl p-3.5 shadow-card border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Document Index
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              7 Sections
            </span>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <a
              href="#section-metadata"
              onClick={() => setActiveSection("section-metadata")}
              className={`flex items-center justify-between p-2 rounded-lg transition ${
                activeSection === "section-metadata"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-slate-400">01</span>
                <span className="truncate">Course Metadata</span>
              </span>
              <span className="material-symbols-outlined text-[14px] text-teal-600">
                check_circle
              </span>
            </a>

            <a
              href="#section-cos"
              onClick={() => setActiveSection("section-cos")}
              className={`flex items-center justify-between p-2 rounded-lg transition ${
                activeSection === "section-cos"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-slate-400">02</span>
                <span className="truncate">Outcomes (COs)</span>
              </span>
              <span className="material-symbols-outlined text-[14px] text-teal-600">
                check_circle
              </span>
            </a>

            <a
              href="#section-syllabus"
              onClick={() => setActiveSection("section-syllabus")}
              className={`flex items-center justify-between p-2 rounded-lg transition ${
                activeSection === "section-syllabus"
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-slate-400">03</span>
                <span className="truncate">Unit Syllabus</span>
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                5 Units
              </span>
            </a>

            {/* Teaching Hours with Warning Pill */}
            <a
              href="#section-hours"
              onClick={() => setActiveSection("section-hours")}
              className="flex flex-col gap-0.5 p-2 rounded-lg bg-amber-50/70 text-amber-900 border border-amber-200/70"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-amber-600 font-bold">04</span>
                  <span className="truncate font-bold">Teaching Hours</span>
                </span>
                <span className="material-symbols-outlined text-[14px] text-amber-600">
                  warning
                </span>
              </div>
              <span className="text-[9px] text-amber-700 pl-4 font-semibold">
                Lab Contact Deficit Flagged
              </span>
            </a>

            <a
              href="#section-assessment"
              onClick={() => setActiveSection("section-assessment")}
              className="flex items-center justify-between p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-slate-400">05</span>
                <span className="truncate">Assessment Rubrics</span>
              </span>
              <span className="material-symbols-outlined text-[14px] text-slate-400">
                pending
              </span>
            </a>
          </nav>

          {/* Document Health Mini Gauge */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold text-slate-400">Completeness</span>
              <span className="text-xs font-black text-indigo-600">92%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "92%" }}></div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
              <span className="material-symbols-outlined text-[12px]">info</span>
              <span>Ready for CO-PO Mapping</span>
            </div>
          </div>
        </aside>

        {/* Central Document Editing Canvas */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {/* Section: Course Header & Primary Metadata */}
          <section
            id="section-metadata"
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-bold">
                  2023 OBE Scheme
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                  Semester III • B.Tech CSE
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  Credits LTP: {data.course.credits_ltp}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span>Course Code:</span>
                <input
                  type="text"
                  value={data.course.code}
                  onChange={(e) => handleUpdateCourseCode(e.target.value)}
                  className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 w-24 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Editable Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Course Official Title
              </label>
              <input
                type="text"
                value={data.course.title}
                onChange={(e) => handleUpdateCourseTitle(e.target.value)}
                className="w-full font-black text-xl text-slate-900 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {/* Course Summary */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Course Scope & Abstract Summary
              </label>
              <textarea
                rows={3}
                value={data.course.summary}
                onChange={(e) =>
                  onUpdateData((prev) => ({
                    ...prev,
                    course: { ...prev.course, summary: e.target.value },
                  }))
                }
                className="w-full text-xs text-slate-700 bg-slate-50 focus:bg-white rounded-xl p-3 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              />
            </div>

            {/* Metadata Bento Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lecture Hours</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900">
                    {data.teaching_hours.lectures}
                  </span>
                  <span className="text-xs text-slate-400">hrs</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Practical Hours</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-amber-600">
                    {data.teaching_hours.lab}
                  </span>
                  <span className="text-xs text-amber-600 font-semibold">/ 30 min req</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Curriculum Units</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900">{data.units.length}</span>
                  <span className="text-xs text-slate-400">modules</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bloom Depth</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-indigo-600">L3–L6</span>
                  <span className="text-xs text-slate-400">Apply/Create</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Course Outcomes (COs) Editor */}
          <section
            id="section-cos"
            className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-900">3. Course Outcomes (COs)</h2>
                <p className="text-xs text-slate-500">
                  Articulate measurable, Bloom-aligned learning competencies expected upon course completion.
                </p>
              </div>
              <button
                onClick={handleAddNewCo}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-xl font-bold text-xs transition border border-blue-200 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add New CO</span>
              </button>
            </div>

            {/* COs Table Matrix matching Stitch Screen */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3 w-16">CO ID</th>
                    <th className="py-2.5 px-3">Outcome Statement (Measurable Action Verb)</th>
                    <th className="py-2.5 px-3 w-40">Cognitive Taxonomy</th>
                    <th className="py-2.5 px-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data.course_outcomes.map((co) => (
                    <tr key={co.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 align-top font-black text-blue-600 text-xs">
                        {co.id}
                      </td>
                      <td className="py-2 px-3 align-top">
                        <textarea
                          rows={2}
                          value={co.statement}
                          onChange={(e) => handleUpdateCoStatement(co.id, e.target.value)}
                          className="w-full bg-transparent p-1.5 rounded-lg border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-semibold text-slate-800 text-xs leading-snug transition"
                        />
                      </td>
                      <td className="py-3 px-3 align-top">
                        <select
                          value={co.bloom_level}
                          onChange={(e) => handleUpdateCoBloom(co.id, Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>L1 - Remember</option>
                          <option value={2}>L2 - Understand</option>
                          <option value={3}>L3 - Apply</option>
                          <option value={4}>L4 - Analyze</option>
                          <option value={5}>L5 - Evaluate</option>
                          <option value={6}>L6 - Create</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 align-top text-center">
                        <button
                          onClick={() => handleDeleteCo(co.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Delete outcome"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Unit-wise Detailed Syllabus */}
          <section id="section-syllabus" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-slate-900">4. Unit-wise Detailed Syllabus</h2>
                <p className="text-xs text-slate-500">
                  Breakdown of theory, lab modules, and learning objectives per instructional block.
                </p>
              </div>
              <span className="text-xs font-bold bg-white text-slate-700 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                Total: {data.units.length} Units
              </span>
            </div>

            {data.units.map((unit) => (
              <article
                key={unit.number}
                className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                      {unit.number}
                    </span>
                    <input
                      type="text"
                      value={unit.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        onUpdateData((prev) => ({
                          ...prev,
                          units: prev.units.map((u) =>
                            u.number === unit.number ? { ...u, title: newTitle } : u
                          ),
                        }));
                      }}
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full max-w-md px-1"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    9 Lectures • 5 Lab Hrs
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">menu_book</span>
                      Theory Syllabus & Conceptual Topics
                    </span>
                    <textarea
                      rows={3}
                      defaultValue={`Concepts, representations, invariants, and algorithmic paradigms for Unit ${unit.number} foundational understanding.`}
                      className="w-full text-xs text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">terminal</span>
                      Laboratory Experiments & Code Exercises
                    </span>
                    <textarea
                      rows={3}
                      value={unit.lab || "Hands-on implementation and performance benchmarking."}
                      onChange={(e) => {
                        const newLab = e.target.value;
                        onUpdateData((prev) => ({
                          ...prev,
                          units: prev.units.map((u) =>
                            u.number === unit.number ? { ...u, lab: newLab } : u
                          ),
                        }));
                      }}
                      className="w-full text-xs text-slate-700 bg-transparent outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("extracted-content")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Extracted Review</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Course Outcomes Ready</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Proceed to Accreditation Matrix</span>
        </div>

        <button
          onClick={() => onNavigate("copo-mapping")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-pill-btn transition active:scale-95"
        >
          <span>Continue to CO–PO–PSO Mapping</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
