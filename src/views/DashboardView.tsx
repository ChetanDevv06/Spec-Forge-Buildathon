import React from "react";
import type { NavPath, SpecificationSummary } from "../types";

interface DashboardViewProps {
  specifications: SpecificationSummary[];
  onNavigate: (path: NavPath) => void;
  onSelectCourse: (code: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  specifications,
  onNavigate,
  onSelectCourse,
}) => {
  const draftingList = specifications.filter((s) => s.status === "Draft");
  const inReviewList = specifications.filter((s) => s.status === "Under Review");
  const returnedList = specifications.filter((s) => s.status === "Returned");
  const approvedList = specifications.filter((s) => s.status === "Approved");

  return (
    <div className="space-y-6">
      {/* Metrics & Widgets Overview Banner matching Stitch */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-5 shadow-card grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Chart: Weekly Syllabi Ingestion */}
        <div className="md:col-span-4 pr-3 md:border-r border-slate-100">
          <div className="text-xs font-bold text-slate-800 mb-2">
            Curriculum Ingestion & CO Targets
          </div>
          <div className="flex items-end justify-between h-20 pt-2 px-2 text-[10px] text-slate-400 font-medium">
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-5 h-11 bg-teal-200/80 rounded-t-sm border border-teal-300"></div>
              <span>Mon</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-5 h-16 bg-sky-200/90 rounded-t-sm border border-sky-300"></div>
              <span>Tue</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-5 h-14 bg-indigo-100 rounded-t-sm border border-indigo-200 bar-hatch"></div>
              <span>Wed</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-5 h-8 bg-teal-300/80 rounded-t-sm border border-teal-400"></div>
              <span>Thu</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-5 h-16 bg-rose-200/80 rounded-t-sm border border-rose-300 bar-hatch"></div>
              <span>Fri</span>
            </div>
          </div>
        </div>

        {/* Center: Radial Gauge - Accredited Compliance */}
        <div className="md:col-span-4 flex items-center justify-center md:border-r border-slate-100 px-4">
          <div className="relative flex flex-col items-center">
            <svg className="w-36 h-20" viewBox="0 0 120 70">
              <path
                d="M 15 65 A 45 45 0 0 1 105 65"
                fill="none"
                stroke="#E2E8F0"
                strokeDasharray="2 3"
                strokeLinecap="round"
                strokeWidth="8"
              ></path>
              <path
                d="M 15 65 A 45 45 0 0 1 88 22"
                fill="none"
                stroke="#0D9488"
                strokeDasharray="2 3"
                strokeLinecap="round"
                strokeWidth="8"
              ></path>
            </svg>
            <div className="text-center -mt-6">
              <span className="text-2xl font-black text-slate-800 tracking-tight">74%</span>
              <p className="text-[11px] font-semibold text-slate-500">Accredited Compliance</p>
            </div>
          </div>
        </div>

        {/* Right: Key Progress Metrics */}
        <div className="md:col-span-2 pl-3">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">52</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>Syllabi in progress</span>
            <span className="text-slate-400 hover:text-slate-800 cursor-pointer font-bold ml-1">
              →
            </span>
          </div>
        </div>

        <div className="md:col-span-2 pl-3">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">14 Days</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>To Cycle Deadline</span>
            <span className="text-slate-400 hover:text-slate-800 cursor-pointer font-bold ml-1">
              →
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns matching Stitch Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        {/* COLUMN 1: Drafting */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">Drafting</h2>
            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              {draftingList.length} ⇅
            </span>
          </div>

          {draftingList.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                onSelectCourse(item.code);
                onNavigate("specification-editor");
              }}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                    {item.code} — {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {item.type} • {item.credits}
                  </p>
                </div>
                <span className="text-slate-300 hover:text-slate-600 font-bold ml-1">⋮</span>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  📅 {item.updatedAt}
                </span>
                <span className="flex items-center space-x-2">
                  <span>💬 {item.commentsCount}</span>
                  <span>📎 {item.attachmentsCount}</span>
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* COLUMN 2: In Review */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">In Review</h2>
            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              {inReviewList.length} ⇅
            </span>
          </div>

          {inReviewList.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                onSelectCourse(item.code);
                onNavigate("reviewer-queue");
              }}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                    {item.code} — {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {item.type} • {item.credits}
                  </p>
                </div>
                <span className="text-slate-300 hover:text-slate-600 font-bold ml-1">⋮</span>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  📅 {item.updatedAt}
                </span>
                <span className="flex items-center space-x-2">
                  <span>💬 {item.commentsCount}</span>
                  <span>📎 {item.attachmentsCount}</span>
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* COLUMN 3: Returned (Action Req.) — includes High-contrast Dark Focus Card */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">
              Offer Sent / Action Req.
            </h2>
            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              {returnedList.length} ⇅
            </span>
          </div>

          {returnedList.map((item) => {
            if (item.isFocus) {
              return (
                /* EXACT HIGHLIGHTED DARK FEATURE CARD FROM STITCH DESIGN */
                <article
                  key={item.id}
                  onClick={() => {
                    onSelectCourse(item.code);
                    onNavigate("specification-editor");
                  }}
                  className="bg-gradient-to-br from-[#1C233D] to-[#12182B] text-white rounded-2xl p-4 shadow-xl border border-slate-800 relative overflow-hidden transition hover:scale-[1.01] cursor-pointer"
                >
                  {/* Subtle internal glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white tracking-tight leading-snug">
                        {item.code} — {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {item.dueDate || "Contact Hour Deficit (-4h Lab) • Tier-1 NBA Scheme Revision"}
                      </p>
                    </div>
                    <span className="text-slate-400 hover:text-white font-bold ml-1">⋮</span>
                  </div>

                  {/* Context Details with Icons */}
                  <div className="mt-3.5 space-y-1.5 text-[10px] text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-[14px] text-indigo-400">
                        location_on
                      </span>
                      <span>CSE Faculty • Lab Block 3B</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="material-symbols-outlined text-[14px] text-indigo-400">
                        mail
                      </span>
                      <span className="truncate">reviewer@specforge.edu</span>
                    </div>
                  </div>

                  {/* Assignee Pill inside dark card */}
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-400 text-slate-900 font-bold text-[9px] flex items-center justify-center">
                      AT
                    </div>
                    <div className="text-[10px] leading-tight">
                      <span className="text-slate-400 text-[9px] block">Lead Author</span>
                      <span className="font-semibold text-slate-200">{item.author}</span>
                    </div>
                  </div>

                  {/* Bottom Action Metadata */}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="bg-slate-800/90 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 font-semibold">
                      📅 {item.updatedAt}
                    </span>
                    <span className="flex items-center space-x-2">
                      <span>💬 {item.commentsCount}</span>
                      <span className="text-amber-400 font-bold">⚠️ 1</span>
                    </span>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={item.id}
                onClick={() => {
                  onSelectCourse(item.code);
                  onNavigate("specification-editor");
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-snug">
                      {item.code} — {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {item.type} • {item.credits}
                    </p>
                  </div>
                  <span className="text-slate-300 hover:text-slate-600 font-bold ml-1">⋮</span>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                    📅 {item.updatedAt}
                  </span>
                  <span className="flex items-center space-x-2">
                    <span>💬 {item.commentsCount}</span>
                    <span>📎 {item.attachmentsCount}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        {/* COLUMN 4: Approved / Closed */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-sm text-slate-800 tracking-tight">
              Approved / Closed
            </h2>
            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              {approvedList.length} ⇅
            </span>
          </div>

          {approvedList.map((item) => (
            <article
              key={item.id}
              onClick={() => {
                onSelectCourse(item.code);
                onNavigate("preview-export");
              }}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                    {item.code} — {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {item.type} • {item.credits}
                  </p>
                </div>
                <span className="text-slate-300 hover:text-slate-600 font-bold ml-1">⋮</span>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                  ✓ Accredited
                </span>
                <span className="flex items-center space-x-2">
                  <span>💬 {item.commentsCount}</span>
                  <span>📎 {item.attachmentsCount}</span>
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};
