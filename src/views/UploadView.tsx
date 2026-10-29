import React, { useRef, useState } from "react";
import type { NavPath } from "../types";

interface UploadViewProps {
  onNavigate: (path: NavPath) => void;
  onFilesSelected: (specFile: File, blueprintFile: File | null) => Promise<void>;
  isProcessing: boolean;
  errorMsg: string | null;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onNavigate,
  onFilesSelected,
  isProcessing,
  errorMsg,
}) => {
  const specInputRef = useRef<HTMLInputElement>(null);
  const blueprintInputRef = useRef<HTMLInputElement>(null);

  const [specFile, setSpecFile] = useState<File | null>(null);
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [modality, setModality] = useState<"auto" | "non_lab" | "practical">("auto");

  const handleStartExtraction = async () => {
    if (!specFile) {
      alert("Please upload the required Course Specification document first.");
      return;
    }
    await onFilesSelected(specFile, blueprintFile);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs tracking-wider uppercase mb-1">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Syllabus Transformation Pipeline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Specification
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-0.5">
            Ingest existing course syllabi and optional blueprint evaluation schemes into structured
            OBE specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white shadow-card rounded-xl px-3.5 py-1.5 border border-slate-200/80 self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs text-slate-600">
            Pipeline Engine: <strong className="text-slate-900 font-bold">SpecParser v4.8</strong>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Ingestion Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Primary Required Intake Card */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900">
                      Required Master Course Specification
                    </h2>
                    <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Syllabus document containing module units, lecture plans, reference books, and stated outcomes.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                DOCX, PDF, HTML • Max 35MB
              </span>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={specInputRef}
              accept=".docx,.pdf,.html,.doc"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSpecFile(e.target.files[0]);
                }
              }}
            />

            {/* Active Uploaded Document Pill Card or Drop Area */}
            {specFile ? (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-white text-blue-600 flex items-center justify-center shadow-sm shrink-0 border border-slate-200">
                      <span className="material-symbols-outlined text-[26px]">article</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {specFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {(specFile.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-600 mt-0.5 font-medium">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Source Loaded & Ready</span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Validated Format
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => specInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition text-xs font-semibold shadow-2xs border border-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      <span className="hidden sm:inline">Replace</span>
                    </button>
                    <button
                      onClick={() => setSpecFile(null)}
                      className="w-8 h-8 rounded-lg bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center shadow-2xs border border-slate-200"
                      title="Remove Document"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                    </button>
                  </div>
                </div>

                {/* Highlights Chips */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Course Code</span>
                    <span className="text-xs font-bold text-blue-600">Auto-Extracting</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Credits</span>
                    <span className="text-xs font-bold text-slate-700">L-T-P Detect</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Units</span>
                    <span className="text-xs font-bold text-slate-700">5 Modules Target</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Target COs</span>
                    <span className="text-xs font-bold text-indigo-600">NBA Outcomes</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => specInputRef.current?.click()}
                className="rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/70 hover:bg-slate-100 border-2 border-dashed border-slate-300 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-400 text-[36px] mb-2">
                  cloud_upload
                </span>
                <div className="font-bold text-xs text-slate-800">
                  Drag & drop course syllabus here, or{" "}
                  <span className="text-blue-600 hover:underline">browse files</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Microsoft Word (.docx, .doc), PDF, and Canvas/Blackboard HTML exports
                </p>
              </div>
            )}
          </div>

          {/* 2. Optional Blueprint Evaluation Card */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[24px]">schema</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900">
                      Course Blueprint & Departmental Guidelines
                    </h2>
                    <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Weights matrix, continuous assessment scheme, and taxonomy Bloom targets. Authoritative for COs and Units.
                  </p>
                </div>
              </div>
            </div>

            <input
              type="file"
              ref={blueprintInputRef}
              accept=".docx,.pdf,.doc,.xlsx,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setBlueprintFile(e.target.files[0]);
                }
              }}
            />

            {blueprintFile ? (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{blueprintFile.name}</span>
                    <div className="text-[10px] text-teal-700 font-medium">
                      Blueprint attached • Precedence rules will apply
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBlueprintFile(null)}
                  className="w-8 h-8 rounded-lg bg-white text-slate-500 hover:text-red-600 flex items-center justify-center shadow-2xs border border-slate-200"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => blueprintInputRef.current?.click()}
                className="rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/40 hover:bg-slate-100 border border-dashed border-slate-300 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-700 mb-2 shadow-2xs border border-slate-200">
                  <span className="material-symbols-outlined text-[20px]">post_add</span>
                </div>
                <span className="font-bold text-xs text-slate-800">
                  Drop question-paper blueprint (.docx, .doc, .pdf)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  If unprovided, system extracts and verifies syllabus autonomously
                </span>
              </div>
            )}
          </div>

          {/* Extraction Intelligence Summary Widget */}
          <div className="bg-slate-100/70 rounded-2xl p-4 flex items-center justify-between gap-4 border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-2xs border border-slate-200 shrink-0">
                <span className="material-symbols-outlined text-[22px]">troubleshoot</span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">
                  AI Extraction Preflight Verification
                </div>
                <div className="text-[11px] text-slate-500">
                  Semantic matching verifies theory/lab contact hours, Bloom ceiling, and PO-PSO compliance targets.
                </div>
              </div>
            </div>
            <span className="text-[10px] text-teal-800 bg-teal-100 font-bold px-2.5 py-1 rounded-full shrink-0">
              V1–V10 Deterministic Engine Ready
            </span>
          </div>
        </div>

        {/* Right Column: Settings & Ingestion Controls Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Curricular Context</h3>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">tune</span>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Academic Department
              </label>
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">
                    domain
                  </span>
                  <span className="font-bold text-xs text-slate-800">
                    Computer Science & Engineering
                  </span>
                </div>
                <span className="material-symbols-outlined text-teal-600 text-[16px]">
                  verified
                </span>
              </div>
            </div>

            {/* Framework */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Accreditation Framework
              </label>
              <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200/80">
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    Regulation 2023 (OBE Tier-1)
                  </div>
                  <div className="text-[10px] text-slate-400">NBA SAR Criteria 2.1 Compliant</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">lock</span>
              </div>
            </div>

            {/* Modality Radio Options */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Modality Template Resolution
              </label>
              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 cursor-pointer">
                  <input
                    type="radio"
                    name="modality"
                    checked={modality === "auto"}
                    onChange={() => setModality("auto")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Auto-detect from contact hours
                    </div>
                    <div className="text-[10px] text-indigo-700 font-medium">
                      Integrated Lab if practical credits &gt; 0
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 cursor-pointer">
                  <input
                    type="radio"
                    name="modality"
                    checked={modality === "non_lab"}
                    onChange={() => setModality("non_lab")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Force Non-Lab (Lecture / Tutorial)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Omits laboratory outcomes & rubrics
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Bloom Depth Target */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bloom Taxonomy Target
                </label>
                <span className="text-[10px] font-bold text-blue-600">Level 3–5 (Apply-Eval)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div className="bg-teal-500 w-1/4 h-full" title="Remember & Understand"></div>
                <div className="bg-blue-600 w-2/4 h-full" title="Apply & Analyze"></div>
                <div className="bg-indigo-600 w-1/4 h-full" title="Evaluate & Create"></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>L1-L2 (Foundation)</span>
                <span>L3-L4 (Core)</span>
                <span>L5-L6 (Mastery)</span>
              </div>
            </div>
          </div>

          {/* Institutional Governance Anchor Card (Dark Blue / Slate) */}
          <div className="bg-[#1E2540] text-white rounded-2xl p-5 shadow-card border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                Institutional Governance
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            </div>
            <h4 className="font-bold text-xs text-white">Provenance & Cryptographic Trail</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All extracted Course Outcomes (COs) receive an immutable SHA-256 hash stamp upon ingestion for auditability.
            </p>
            <div className="bg-white/10 rounded-xl p-2 px-3 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-300">SPEC-CSE-2024-T2-089A1</span>
              <span className="text-sky-300 font-bold">Active Key</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar matching Stitch Screen */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-card border border-slate-200/90 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("workspace-overview")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs transition"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Cancel & Return to Workspace</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              specFile ? "bg-emerald-500" : "bg-slate-400"
            }`}
          ></span>
          <span className="font-semibold text-slate-700">
            {specFile ? "Specification file loaded" : "Upload specification file to continue"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Ready for structured extraction</span>
        </div>

        <button
          onClick={handleStartExtraction}
          disabled={!specFile || isProcessing}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-pill-btn transition active:scale-95 ${
            !specFile || isProcessing
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-0.5"
          }`}
        >
          {isProcessing ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
              <span>Running Extraction Pipeline...</span>
            </>
          ) : (
            <>
              <span>Continue to Review Extracted Data</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
