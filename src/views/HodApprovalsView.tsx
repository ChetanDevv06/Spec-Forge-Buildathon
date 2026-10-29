import React, { useState } from "react";
import type { NavPath, SpecificationSummary, UserProfile } from "../types";

interface HodApprovalsViewProps {
  specifications: SpecificationSummary[];
  currentUser: UserProfile;
  onNavigate: (path: NavPath) => void;
  onSelectCourse: (code: string) => void;
  onUpdateStatus: (code: string, newStatus: "Draft" | "Under Review" | "Pending HOD" | "Approved" | "Returned") => void;
}

export const HodApprovalsView: React.FC<HodApprovalsViewProps> = ({
  specifications,
  currentUser,
  onNavigate,
  onSelectCourse,
  onUpdateStatus,
}) => {
  const pendingHod = specifications.filter(
    (s) => s.status === "Pending HOD" || s.status === "Under Review"
  );
  const [selectedCourse, setSelectedCourse] = useState<SpecificationSummary | null>(
    pendingHod[0] || null
  );

  const handleFinalApprove = () => {
    if (!selectedCourse) return;
    onUpdateStatus(selectedCourse.code, "Approved");
    alert(`Course specification ${selectedCourse.code} officially approved and accredited by HOD.`);
  };

  const handleReturnCourse = () => {
    if (!selectedCourse) return;
    onUpdateStatus(selectedCourse.code, "Returned");
    alert(`Course specification ${selectedCourse.code} returned with HOD notes.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Executive Departmental Sign-off</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Head of Department Approvals
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
          Final executive approval and institutional accreditation sign-off for academic course
          specifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Pending Sign-offs (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800">
              Awaiting Sign-off ({pendingHod.length})
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              HOD Authority
            </span>
          </div>

          {pendingHod.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200/80 text-center text-xs text-slate-400">
              No specifications pending HOD approval.
            </div>
          ) : (
            pendingHod.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCourse(item)}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-card ${
                  selectedCourse?.id === item.id
                    ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                    : "bg-white border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-600 text-xs">{item.code}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                    {item.status}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Author: {item.author} &bull; {item.department}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sign-off Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCourse ? (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="font-black text-lg text-slate-900">
                    {selectedCourse.code} — {selectedCourse.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Faculty: {selectedCourse.department} &bull; {selectedCourse.credits}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectCourse(selectedCourse.code);
                    onNavigate("preview-export");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Full Document</span>
                </button>
              </div>

              {/* Status Timeline */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Workflow Governance Timeline
                </span>
                <div className="flex items-center justify-between text-xs text-slate-700 pt-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>1. Authored</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>2. Peer Reviewed</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className="flex items-center gap-1.5 font-bold text-blue-700">
                    <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                    <span>3. HOD Decision</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleReturnCourse}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  <span>Return for Re-working</span>
                </button>

                <button
                  onClick={handleFinalApprove}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-pill-btn flex items-center gap-1.5 transition active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Execute Official HOD Approval</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-card border border-slate-200/80 text-center text-xs text-slate-400">
              Select an item to review HOD sign-off options.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
