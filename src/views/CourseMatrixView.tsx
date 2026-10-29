import React, { useState } from "react";
import type { NavPath, SpecificationSummary, SpecStatus } from "../types";

interface CourseMatrixViewProps {
  specifications: SpecificationSummary[];
  onNavigate: (path: NavPath) => void;
  onSelectCourse: (code: string) => void;
}

export const CourseMatrixView: React.FC<CourseMatrixViewProps> = ({
  specifications,
  onNavigate,
  onSelectCourse,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = specifications.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesSearch =
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: SpecStatus) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Under Review":
      case "Pending HOD":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Returned":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>Departmental Syllabi Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Curriculum Course Matrix
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
            Institutional overview of all active course specifications across engineering faculties.
          </p>
        </div>

        <button
          onClick={() => onNavigate("create-specification")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-pill-btn flex items-center gap-1.5 transition active:scale-95 self-start md:self-auto"
        >
          <span>+ Ingest New Syllabus</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 px-4 rounded-xl shadow-card border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["all", "Draft", "Under Review", "Returned", "Approved"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterStatus === st
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "All Specifications" : st}
            </button>
          ))}
        </div>

        <div className="relative w-64 max-w-full">
          <input
            type="text"
            placeholder="Search code, title, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">
            search
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-28">Code</th>
              <th className="py-3 px-4">Course Title & Architecture</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 w-28">Status</th>
              <th className="py-3 px-4 w-32">Lead Author</th>
              <th className="py-3 px-4 w-28 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 font-black text-blue-600 text-xs">
                  {item.code}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.type} • {item.credits}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  {item.department}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {item.author}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => {
                      onSelectCourse(item.code);
                      onNavigate("specification-editor");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition border border-blue-200"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
