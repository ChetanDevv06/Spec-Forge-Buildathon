export type UserRole = "author" | "reviewer" | "hod";

export interface UserProfile {
  name: string;
  roleTitle: string;
  role: UserRole;
  initials: string;
  avatarBg: string;
  avatarText: string;
  email: string;
}

export const USER_PROFILES: Record<UserRole, UserProfile> = {
  author: {
    name: "Dr. Aris Thorne",
    roleTitle: "Lead Syllabus Author",
    role: "author",
    initials: "AT",
    avatarBg: "bg-amber-200 border-amber-300",
    avatarText: "text-amber-800",
    email: "aris.thorne@specforge.edu",
  },
  reviewer: {
    name: "Prof. Sarah Jenkins",
    roleTitle: "ABET Coordinator",
    role: "reviewer",
    initials: "SJ",
    avatarBg: "bg-blue-200 border-blue-300",
    avatarText: "text-blue-800",
    email: "sarah.jenkins@specforge.edu",
  },
  hod: {
    name: "Dr. Marcus Vance",
    roleTitle: "Department Head",
    role: "hod",
    initials: "MV",
    avatarBg: "bg-emerald-200 border-emerald-300",
    avatarText: "text-emerald-800",
    email: "marcus.vance@specforge.edu",
  },
};

export type NavPath =
  | "workspace-overview"
  | "create-specification"
  | "extracted-content"
  | "specification-editor"
  | "copo-mapping"
  | "validation-inspector"
  | "preview-export"
  | "course-matrix"
  | "curriculum-log"
  | "reviewer-queue"
  | "hod-queue"
  | "regulations-and-help";

export type SpecStatus = "Draft" | "Submitted" | "Under Review" | "Pending HOD" | "Approved" | "Returned";

export interface SpecificationSummary {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: string;
  status: SpecStatus;
  updatedAt: string;
  dueDate?: string;
  commentsCount: number;
  attachmentsCount: number;
  author: string;
  department: string;
  isFocus?: boolean;
  warningsCount?: number;
}

export interface DefectItem {
  code: string;
  location: {
    source: "spec" | "blueprint" | "template";
    section?: number | null;
    refs?: string[];
  };
  description: string;
  fix: string;
}

export interface CourseData {
  title: string;
  code: string;
  department: string;
  credits_ltp: string;
  course_type: string;
  summary: string;
}

export interface CourseOutcome {
  id: string;
  statement: string;
  bloom_level: number;
}

export interface UnitItem {
  number: number;
  title: string;
  lab: string | null;
}

export interface MappingCell {
  level: number;
  justification: string;
}

export interface CoPoPsoMap {
  [coId: string]: {
    [targetId: string]: MappingCell;
  };
}

export interface TeachingHours {
  lectures: number;
  lab: number;
  tests_exams: number;
  total: number;
}

export interface AssessmentData {
  components: Array<{ name: string; weight_percent: number }>;
  co_coverage: Record<string, string[]>;
}

export interface SpecForgeData {
  schema_version: string;
  input_id: string;
  template: "integrated" | "non_lab";
  course: CourseData;
  course_outcomes: CourseOutcome[];
  units: UnitItem[];
  co_po_pso_map: CoPoPsoMap;
  teaching_hours: TeachingHours;
  assessment: AssessmentData;
  defects: DefectItem[];
}
