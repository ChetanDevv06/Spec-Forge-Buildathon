import React, { useState } from "react";
import type { NavPath, SpecificationSummary, UserProfile } from "../types";

interface ReviewerQueueViewProps {
  specifications: SpecificationSummary[];
  currentUser: UserProfile;
  onNavigate: (path: NavPath) => void;
  onSelectCourse: (code: string) => void;
  onUpdateStatus: (code: string, newStatus: "Draft" | "Under Review" | "Pending HOD" | "Approved" | "Returned") => void;
}

export const ReviewerQueueView: React.FC<ReviewerQueueViewProps> = ({
  specifications,
  currentUser,
  onNavigate,
  onSelectCourse,
  onUpdateStatus,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<SpecificationSummary | null>(
    specifications.find((s) => s.status === "Under Review") || specifications[0] || null
  );
  const [commentText, setCommentText] = useState("");

  const queue = specifications.filter(
    (s) => s.status === "Under Review" || s.status === "Submitted"
  );

  const handleForwardToHod = () => {
    if (!selectedCourse) return;
    onUpdateStatus(selectedCourse.code, "Pending HOD");
    alert(`Specification ${selectedCourse.code} approved and forwarded to Head of Department.`);
  };

  const handleReturnToAuthor = () => {
    if (!selectedCourse) return;
    if (!commentText.trim()) {
      alert("Please enter a review comment explaining required corrections.");
      return;
    }
    onUpdateStatus(selectedCourse.code, "Returned");
    alert(`Specification ${selectedCourse.code} returned to Author for corrections.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
          <span className="material-symbols-outlined text-[18px]">rate_review</span>
          <span>Departmental Peer Review</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Reviewer Governance Queue
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
          Evaluate submitted course specifications, verify accreditation mappings, and provide
          actionable feedback before HOD sign-off.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Pending Submissions (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800">
              Pending Submissions ({queue.length})
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Reviewer Action
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200/80 text-center text-xs text-slate-400">
              No specifications awaiting review in your queue.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCourse(item)}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-card ${
                  selectedCourse?.id === item.id
                    ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300"
                    : "bg-white border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-600 text-xs">{item.code}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
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

        {/* Right Detail Pane (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCourse ? (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-900">
                      {selectedCourse.code} — {selectedCourse.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {selectedCourse.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Lead Author: {selectedCourse.author} &bull; Department of {selectedCourse.department}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectCourse(selectedCourse.code);
                    onNavigate("specification-editor");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Inspect Spec</span>
                </button>
              </div>

              {/* Review Findings & Comments Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  Peer Review Findings & Directives
                </label>
                <textarea
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter comments, required syllabus amendments, or justification feedback..."
                  className="w-full text-xs text-slate-800 bg-slate-50 focus:bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleReturnToAuthor}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">reply</span>
                  <span>Return for Correction</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleForwardToHod}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-pill-btn flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Forward to HOD for Sign-off</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-card border border-slate-200/80 text-center text-xs text-slate-400">
              Select a course specification from the queue to start review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
