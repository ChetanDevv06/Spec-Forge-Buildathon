import React, { useState } from "react";
import type { NavPath, SpecForgeData } from "../types";

interface PreviewExportViewProps {
  data: SpecForgeData;
  renderedHtml: string | null;
  onNavigate: (path: NavPath) => void;
  onSubmitForReview: () => void;
}

export const PreviewExportView: React.FC<PreviewExportViewProps> = ({
  data,
  renderedHtml,
  onNavigate,
  onSubmitForReview,
}) => {
  const [watermark, setWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Generate fallback HTML if renderedHtml is null
  const getDocumentHtml = () => {
    if (renderedHtml) {
      if (!watermark) {
        return renderedHtml.replace(/DRAFT/g, "");
      }
      return renderedHtml;
    }

    // High quality standalone preview
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.course.code} - ${data.course.title}</title>
  <style>
    body { font-family: Calibri, sans-serif; margin: 24px auto; max-width: 900px; color: #211f1f; line-height: 1.5; font-size: 11pt; }
    h1 { font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 6px; }
    h2 { font-size: 13pt; margin-top: 24px; color: #173d35; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; font-weight: bold; }
    .center { text-align: center; }
    .watermark { position: fixed; top: 35%; left: 15%; font-size: 80pt; color: rgba(200, 50, 50, 0.08); transform: rotate(-30deg); pointer-events: none; z-index: 1000; font-weight: bold; }
  </style>
</head>
<body>
  ${watermark ? '<div class="watermark">DRAFT SPEC</div>' : ""}
  <h1>Course Specifications: ${data.course.title} (${data.course.code})</h1>
  <p><strong>Department:</strong> ${data.course.department} &bull; <strong>Credits (L-T-P):</strong> ${data.course.credits_ltp} &bull; <strong>Template:</strong> ${data.template}</p>
  <p>${data.course.summary}</p>
  
  <h2>1. Course Outcomes (COs)</h2>
  <table>
    <thead><tr><th>ID</th><th>Outcome Statement</th><th>Bloom Level</th></tr></thead>
    <tbody>
      ${data.course_outcomes.map((co) => `<tr><td class="center"><strong>${co.id}</strong></td><td>${co.statement}</td><td class="center">L${co.bloom_level}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>2. Course Units & Syllabus</h2>
  ${data.units.map((u) => `<div style="margin-bottom:12px;"><strong>Unit ${u.number}: ${u.title}</strong><br/><span style="color:#555;">${u.lab ? `<em>Lab Focus:</em> ${u.lab}` : "Standard theory modules."}</span></div>`).join("")}

  <h2>3. Teaching & Learning Hours</h2>
  <p>Lectures: ${data.teaching_hours.lectures}h | Practical/Lab: ${data.teaching_hours.lab}h | Total: ${data.teaching_hours.total}h</p>

  <h2>10. Specification Audit and Quality Findings</h2>
  <table>
    <thead><tr><th>Code</th><th>Location</th><th>Description</th><th>Fix Applied</th></tr></thead>
    <tbody>
      ${data.defects.map((d) => `<tr><td><code>${d.code}</code></td><td>${d.location.source}</td><td>${d.description}</td><td style="color:#166534;">${d.fix}</td></tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
  };

  const handleDownloadHtml = () => {
    setIsExporting(true);
    try {
      const html = getDocumentHtml();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.course.code || "spec"}_specification.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    setIsExporting(true);
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `specforge_output.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Academic Specification Document</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Specification Preview & Institutional Export
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
            Rendered using university approved templates. Ready for department archival and SAR
            accreditation submission.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Watermark toggle */}
          <button
            onClick={() => setWatermark(!watermark)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${
              watermark
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {watermark ? "water_drop" : "water_drop"}
            </span>
            <span>{watermark ? "DRAFT Watermark ON" : "DRAFT Watermark OFF"}</span>
          </button>

          {/* Download HTML */}
          <button
            onClick={handleDownloadHtml}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-card transition"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">code</span>
            <span>Export HTML</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJson}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-card transition"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">data_object</span>
            <span>Export JSON</span>
          </button>

          {/* Submit for Review */}
          <button
            onClick={onSubmitForReview}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-pill-btn transition active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {/* Sandboxed Document Preview Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-2 overflow-hidden flex flex-col items-center">
        <div className="w-full bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Official Academic Template: {data.template === "integrated" ? "integrated_lab.html" : "non_lab.html"}</span>
          <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
            A4 Standard Page Layout
          </span>
        </div>

        <iframe
          title="Course Specification Document Preview"
          srcDoc={getDocumentHtml()}
          sandbox="allow-same-origin allow-scripts"
          className="w-full h-[760px] border-none bg-white rounded-b-xl"
        />
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("validation-inspector")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Validation Matrix</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Specification Ready for Governance</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Audit trails archived</span>
        </div>

        <button
          onClick={() => onNavigate("workspace-overview")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-pill-btn transition active:scale-95"
        >
          <span>Return to Dashboard</span>
          <span className="material-symbols-outlined text-[18px]">home</span>
        </button>
      </div>
    </div>
  );
};
