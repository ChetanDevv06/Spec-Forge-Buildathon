import React, { useEffect, useState } from "react";
import type { NavPath, SpecForgeData, SpecificationSummary, UserRole } from "./types";
import { USER_PROFILES } from "./types";
import { DEFAULT_SPEC_DATA, INITIAL_SPECIFICATIONS } from "./mockData";
import { call } from "./api";
import Settings from "./Settings";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Stepper } from "./components/Stepper";
import { DashboardView } from "./views/DashboardView";
import { UploadView } from "./views/UploadView";
import { ExtractedReviewView } from "./views/ExtractedReviewView";
import { EditorView } from "./views/EditorView";
import { MappingView } from "./views/MappingView";
import { ValidationView } from "./views/ValidationView";
import { PreviewExportView } from "./views/PreviewExportView";
import { CourseMatrixView } from "./views/CourseMatrixView";
import { ReviewerQueueView } from "./views/ReviewerQueueView";
import { HodApprovalsView } from "./views/HodApprovalsView";
import { RegulationsView } from "./views/RegulationsView";
import { CurriculumLogView } from "./views/CurriculumLogView";

export default function App() {
  const [currentPath, setCurrentPath] = useState<NavPath>("workspace-overview");
  const [currentRole, setCurrentRole] = useState<UserRole>("author");
  const [specifications, setSpecifications] = useState<SpecificationSummary[]>(INITIAL_SPECIFICATIONS);
  const [specData, setSpecData] = useState<SpecForgeData>(DEFAULT_SPEC_DATA);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<string>("checking...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check backend server health
  useEffect(() => {
    call<{ status: string }>("/health")
      .then((d) => setServerStatus(d?.status || "up"))
      .catch(() => setServerStatus("offline"));
  }, []);

  const currentUser = USER_PROFILES[currentRole];

  // Real backend generation integration
  const handleUploadAndProcess = async (specFile: File, blueprintFile: File | null) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const form = new FormData();
      form.append("spec", specFile);
      if (blueprintFile) {
        form.append("blueprint", blueprintFile);
      }

      const res = await call<{ output: SpecForgeData; html: string }>("/generate", {
        method: "POST",
        body: form,
      });

      if (res && res.output) {
        setSpecData(res.output);
        setRenderedHtml(res.html);

        // Add or update in specifications list
        const newSpec: SpecificationSummary = {
          id: `spec-${res.output.course.code.toLowerCase()}`,
          code: res.output.course.code,
          title: res.output.course.title,
          type: res.output.template === "integrated" ? "Integrated Lab" : "Non-Lab",
          credits: `${res.output.course.credits_ltp} Credits`,
          status: "Draft",
          updatedAt: "Just now",
          commentsCount: 0,
          attachmentsCount: blueprintFile ? 2 : 1,
          author: currentUser.name,
          department: res.output.course.department || "Computer Science",
          isFocus: true,
        };

        setSpecifications((prev) => [newSpec, ...prev.filter((s) => s.code !== newSpec.code)]);
        setCurrentPath("extracted-content");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setErrorMsg((err as Error).message || "Generation failed. Please verify your AI Key in Settings.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectCourse = (code: string) => {
    if (code !== specData.course.code) {
      setSpecData((prev) => ({
        ...prev,
        course: {
          ...prev.course,
          code,
          title: specifications.find((s) => s.code === code)?.title || prev.course.title,
        },
      }));
    }
  };

  const handleStatusUpdate = (
    code: string,
    newStatus: "Draft" | "Under Review" | "Pending HOD" | "Approved" | "Returned"
  ) => {
    setSpecifications((prev) =>
      prev.map((s) => (s.code === code ? { ...s, status: newStatus } : s))
    );
  };

  const handleSubmitForReview = () => {
    handleStatusUpdate(specData.course.code, "Under Review");
    alert(`Course specification ${specData.course.code} submitted to Reviewer Queue.`);
    setCurrentPath("workspace-overview");
  };

  const isStepperVisible =
    currentPath === "create-specification" ||
    currentPath === "extracted-content" ||
    currentPath === "specification-editor" ||
    currentPath === "copo-mapping" ||
    currentPath === "validation-inspector" ||
    currentPath === "preview-export";

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-5 lg:p-7 select-none text-slate-800 antialiased">
      {/* BEGIN: ApplicationWindowContainer — Exact macOS chrome curvature & elevation from Stitch */}
      <main className="w-full max-w-[1360px] h-[92vh] max-h-[1000px] bg-white rounded-[24px] shadow-window overflow-hidden border border-neutral-300/70 flex flex-col transition-all">
        {/* BEGIN: MacOSWindowChrome */}
        <header className="bg-[#F0EFF1] border-b border-[#E1E0E5] px-4 py-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            {/* Traffic lights */}
            <span className="w-3 h-3 rounded-full bg-[#EC6A5E] border border-[#D04E44] inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#F4BF4F] border border-[#D6A035] inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-[#62C554] border border-[#48A73C] inline-block shadow-sm"></span>

            {/* History navigation buttons */}
            <div className="flex items-center space-x-2 ml-4 text-slate-400">
              <span
                onClick={() => setCurrentPath("workspace-overview")}
                className="material-symbols-outlined text-[16px] hover:text-slate-700 cursor-pointer"
              >
                arrow_back
              </span>
              <span
                onClick={() => setCurrentPath("create-specification")}
                className="material-symbols-outlined text-[16px] hover:text-slate-700 cursor-pointer"
              >
                arrow_forward
              </span>
            </div>
          </div>

          {/* Simulated Browser Address Pill */}
          <div className="w-1/3 min-w-[240px] max-w-[420px] bg-white border border-slate-200/90 rounded-md py-0.5 px-3 flex items-center justify-center space-x-2 text-[11px] text-slate-600 shadow-2xs">
            <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
            <span className="font-semibold tracking-tight text-slate-700">
              specforge.internal/{currentPath}
            </span>
            <span
              onClick={() => call<{ status: string }>("/health").then((d) => setServerStatus(d.status))}
              className="material-symbols-outlined text-[14px] text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
              title="Refresh backend status"
            >
              refresh
            </span>
          </div>

          {/* Right Window Utilities */}
          <div className="flex items-center space-x-3 text-slate-400">
            <span
              onClick={() => setSettingsOpen(true)}
              className="material-symbols-outlined text-[16px] hover:text-slate-700 cursor-pointer"
              title="Settings"
            >
              settings
            </span>
            <span
              onClick={() => setCurrentPath("regulations-and-help")}
              className="material-symbols-outlined text-[16px] hover:text-slate-700 cursor-pointer"
              title="Regulations & Guide"
            >
              help_outline
            </span>
          </div>
        </header>
        {/* END: MacOSWindowChrome */}

        {/* BEGIN: AppLayoutMain */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            currentPath={currentPath}
            onNavigate={setCurrentPath}
            currentUser={currentUser}
            onRoleChange={setCurrentRole}
          />

          {/* Workspace Area */}
          <div className="flex-1 bg-[#FBF9F5] flex flex-col min-h-0 overflow-hidden">
            {/* Top Toolbar */}
            <Header
              onNavigate={setCurrentPath}
              onOpenSettings={() => setSettingsOpen(true)}
              serverStatus={serverStatus}
            />

            {/* Scrollable Main Content Container */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              {/* Stepper (visible on multi-step creation flow) */}
              {isStepperVisible && (
                <Stepper currentPath={currentPath} onNavigate={setCurrentPath} />
              )}

              {/* View Router */}
              {currentPath === "workspace-overview" && (
                <DashboardView
                  specifications={specifications}
                  onNavigate={setCurrentPath}
                  onSelectCourse={handleSelectCourse}
                />
              )}

              {currentPath === "create-specification" && (
                <UploadView
                  onNavigate={setCurrentPath}
                  onFilesSelected={handleUploadAndProcess}
                  isProcessing={isProcessing}
                  errorMsg={errorMsg}
                />
              )}

              {currentPath === "extracted-content" && (
                <ExtractedReviewView
                  data={specData}
                  onNavigate={setCurrentPath}
                  onUpdateCo={(id, statement, bloom_level) =>
                    setSpecData((prev) => ({
                      ...prev,
                      course_outcomes: prev.course_outcomes.map((c) =>
                        c.id === id ? { ...c, statement, bloom_level } : c
                      ),
                    }))
                  }
                />
              )}

              {currentPath === "specification-editor" && (
                <EditorView
                  data={specData}
                  onNavigate={setCurrentPath}
                  onUpdateData={setSpecData}
                />
              )}

              {currentPath === "copo-mapping" && (
                <MappingView
                  data={specData}
                  onNavigate={setCurrentPath}
                  onUpdateData={setSpecData}
                />
              )}

              {currentPath === "validation-inspector" && (
                <ValidationView data={specData} onNavigate={setCurrentPath} />
              )}

              {currentPath === "preview-export" && (
                <PreviewExportView
                  data={specData}
                  renderedHtml={renderedHtml}
                  onNavigate={setCurrentPath}
                  onSubmitForReview={handleSubmitForReview}
                />
              )}

              {currentPath === "course-matrix" && (
                <CourseMatrixView
                  specifications={specifications}
                  onNavigate={setCurrentPath}
                  onSelectCourse={handleSelectCourse}
                />
              )}

              {currentPath === "reviewer-queue" && (
                <ReviewerQueueView
                  specifications={specifications}
                  currentUser={currentUser}
                  onNavigate={setCurrentPath}
                  onSelectCourse={handleSelectCourse}
                  onUpdateStatus={handleStatusUpdate}
                />
              )}

              {currentPath === "hod-queue" && (
                <HodApprovalsView
                  specifications={specifications}
                  currentUser={currentUser}
                  onNavigate={setCurrentPath}
                  onSelectCourse={handleSelectCourse}
                  onUpdateStatus={handleStatusUpdate}
                />
              )}

              {currentPath === "regulations-and-help" && (
                <RegulationsView onNavigate={setCurrentPath} />
              )}

              {currentPath === "curriculum-log" && (
                <CurriculumLogView onNavigate={setCurrentPath} />
              )}
            </div>
          </div>
        </div>
        {/* END: AppLayoutMain */}
      </main>

      {/* Settings Modal */}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
