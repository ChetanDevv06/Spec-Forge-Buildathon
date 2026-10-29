import { z } from "zod";

export const DEFECT_CODES = [
  "CO_MISSING_IN_TABLE",
  "CO_EXTRA_IN_TABLE",
  "CO_ASSESSMENT_MISMATCH",
  "PSO_COLUMN_MISMATCH",
  "MAPPING_BLOOM_MISMATCH",
  "MAPPING_UNSUPPORTED",
  "WRONG_TEMPLATE",
  "PLACEHOLDER_TEXT",
  "SUMMARY_SYLLABUS_MISMATCH",
  "LABEL_OR_TITLE_MISMATCH",
  "HOURS_INCONSISTENT",
  "WEIGHTAGE_INCONSISTENT",
  "TYPO_OR_FORMAT",
  "SECTION_NOT_IN_TEMPLATE",
  "MARKS_INCONSISTENT",
  "OTHER",
] as const;

export const DefectCodeSchema = z.enum(DEFECT_CODES);

export const DefectLocationSchema = z
  .object({
    source: z.enum(["spec", "blueprint", "template"]),
    section: z.number().int().min(1).max(12).nullable().optional(),
    refs: z.array(z.string()).optional(),
  })
  .strict();

export const DefectSchema = z
  .object({
    code: DefectCodeSchema,
    location: DefectLocationSchema,
    description: z.string(),
    fix: z.string(),
  })
  .strict();

export const CourseSchema = z
  .object({
    title: z.string(),
    code: z.string(),
    department: z.string(),
    credits_ltp: z.string().regex(/^\d+:\d+:\d+$/, "Credits LTP must be in format L:T:P e.g. 3:0:1"),
    course_type: z.string(),
    summary: z.string(),
  })
  .strict();

export const CourseOutcomeSchema = z
  .object({
    id: z.string().regex(/^CO-\d+$/, "ID must match CO-d+"),
    statement: z.string(),
    bloom_level: z.number().int().min(1).max(6),
  })
  .strict();

export const UnitSchema = z
  .object({
    number: z.number().int(),
    title: z.string(),
    lab: z.string().nullable().optional(),
  })
  .strict();

export const CoPoCellSchema = z
  .object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    justification: z.string(),
  })
  .strict();

export const CoPoPsoMapSchema = z.record(
  z.string(),
  z.record(
    z.string().regex(/^(PO-([1-9]|1[01])|PSO-\d+)$/),
    CoPoCellSchema.nullable().optional()
  )
);

export const TeachingHoursSchema = z.record(z.string(), z.number());

export const AssessmentComponentSchema = z
  .object({
    name: z.string(),
    weight_percent: z.number(),
  })
  .strict();

export const AssessmentSchema = z
  .object({
    components: z.array(AssessmentComponentSchema),
    co_coverage: z.record(z.string(), z.array(z.string())),
  })
  .strict();

export const SpecForgeOutputSchema = z
  .object({
    schema_version: z.literal("1.0"),
    input_id: z.string(),
    template: z.enum(["integrated", "non_lab"]),
    course: CourseSchema,
    course_outcomes: z.array(CourseOutcomeSchema).min(1),
    units: z.array(UnitSchema),
    co_po_pso_map: CoPoPsoMapSchema,
    teaching_hours: TeachingHoursSchema,
    assessment: AssessmentSchema,
    defects: z.array(DefectSchema),
  })
  .strict();

export type SpecForgeOutput = z.infer<typeof SpecForgeOutputSchema>;
export type CourseOutcome = z.infer<typeof CourseOutcomeSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type Defect = z.infer<typeof DefectSchema>;
export type TemplateType = "integrated" | "non_lab";
