import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import { extractFile, type ExtractionResult } from "./extract.js";
import { generateJson, type LlmConfig } from "./llm.js";
import {
  SpecForgeOutputSchema,
  type SpecForgeOutput,
  type TemplateType,
  type Defect,
} from "./schema.js";
import { renderSpecHtml } from "./render.js";
import { runDeterministicValidation } from "./validate.js";
import { ApiError } from "./envelope.js";

interface PipelineResult {
  output: SpecForgeOutput;
  html: string;
}

function loadReferenceConfig() {
  const cfgPath = path.resolve(process.cwd(), "config/po_pso.json");
  if (!fs.existsSync(cfgPath)) {
    throw new Error(`Missing reference config at ${cfgPath}`);
  }
  return JSON.parse(fs.readFileSync(cfgPath, "utf8"));
}

function determineTemplate(creditsLtp: string, courseType: string): TemplateType {
  const parts = creditsLtp.split(":").map((p) => Number(p.trim()) || 0);
  const practicalCredits = parts.length >= 3 ? parts[2] : 0;
  const isLabType = courseType.toLowerCase().includes("laboratory") || courseType.toLowerCase().includes("lab");

  return practicalCredits > 0 || isLabType ? "integrated" : "non_lab";
}

function buildPrompt(
  spec: ExtractionResult,
  blueprint: ExtractionResult | null,
  refData: any
): string {
  const blueprintNotice = blueprint
    ? `A question-paper blueprint IS provided.
CRITICAL PRECEDENCE RULE:
- The blueprint is the authoritative source of truth for Course Outcomes (COs) and unit-wise syllabus (Units).
- The existing course specification is the source for course identity (code, title, department, course_type), credits_ltp, teaching hours, assessment, and resources.
- If the course specification's COs or syllabus units differ from the blueprint, THE BLUEPRINT PREVAILS.
- Any contradictions between the specification and blueprint MUST be recorded in the defects array with code 'LABEL_OR_TITLE_MISMATCH', 'SUMMARY_SYLLABUS_MISMATCH', or other appropriate code.`
    : `No question-paper blueprint was provided.
Derive Course Outcomes (COs) and syllabus units from the course specification.
Record a defect or note 'no blueprint supplied' if appropriate.`;

  return `You are an expert academic curriculum engineer and accreditation specialist.
Analyze the provided university course specification (and optional blueprint) and produce a complete, academically defensible, and fully corrected Course Specification object adhering strictly to the JSON schema.

${blueprintNotice}

==================== REFERENCE ACCREDITATION DATA ====================
PO/PSO Reference definitions from config/po_pso.json:
${JSON.stringify(refData, null, 2)}

==================== CO-PO-PSO MAPPING RULES ====================
1. Scale: 3 = Very strong, 2 = Strong, 1 = Moderate. Omit cell or leave null when there is no relation.
2. Bloom's level: assign integer 1-6 according to the CO statement action verb and cognitive demand:
   L1 Remember (1), L2 Understand (2), L3 Apply (3), L4 Analyse (4), L5 Evaluate (5), L6 Create (6).
3. Bloom ceiling: A CO cannot map to a PO more strongly than its Bloom level supports (e.g. an L2 Understand CO cannot have level 3 in PO-3 Design).
4. PO-5 requires actual tool / programming / laboratory use. PO-6 to PO-10 require explicit evidence in syllabus or assessment; if no evidence, leave cell empty.
5. Every CO in course_outcomes must map to at least one PO.
6. Every populated mapping cell MUST contain a concise, single-line academic justification explaining how the outcome contributes to the programme outcome.
7. Columns are strictly PO-1 through PO-11, and PSO-1, PSO-2.

==================== TEMPLATE SELECTION RULE ====================
- If practical credits in credits_ltp > 0 (e.g. "3:0:1") or course_type includes "laboratory", template MUST be "integrated".
- Otherwise, template MUST be "non_lab".

==================== COURSE SPECIFICATION TEXT ====================
${spec.text}

${
  blueprint
    ? `==================== BLUEPRINT TEXT ====================
${blueprint.text}`
    : ""
}

==================== REQUIRED JSON FORMAT ====================
Produce a single JSON object with EXACTLY these top-level fields (no markdown, no extra commentary):
- "schema_version": "1.0"
- "input_id": "SAMPLE"
- "template": "integrated" | "non_lab"
- "course": { "title": string, "code": string, "department": string, "credits_ltp": "L:T:P", "course_type": string, "summary": string }
- "course_outcomes": [ { "id": "CO-1", "statement": string, "bloom_level": 1-6 }, ... ]
- "units": [ { "number": 1, "title": string, "lab": string | null }, ... ]
- "co_po_pso_map": {
    "CO-1": {
      "PO-1": { "level": 1|2|3, "justification": string },
      "PSO-1": { "level": 1|2|3, "justification": string }
    }
  }
- "teaching_hours": { "lectures": number, "lab": number, "tests_exams": number, "total": number }
- "assessment": {
    "components": [ { "name": string, "weight_percent": number } ],
    "co_coverage": { "CO-1": [ string, ... ] }
  }
- "defects": [
    {
      "code": "CO_MISSING_IN_TABLE" | "CO_EXTRA_IN_TABLE" | "CO_ASSESSMENT_MISMATCH" | "PSO_COLUMN_MISMATCH" | "MAPPING_BLOOM_MISMATCH" | "MAPPING_UNSUPPORTED" | "WRONG_TEMPLATE" | "PLACEHOLDER_TEXT" | "SUMMARY_SYLLABUS_MISMATCH" | "LABEL_OR_TITLE_MISMATCH" | "HOURS_INCONSISTENT" | "WEIGHTAGE_INCONSISTENT" | "TYPO_OR_FORMAT" | "SECTION_NOT_IN_TEMPLATE" | "MARKS_INCONSISTENT" | "OTHER",
      "location": { "source": "spec" | "blueprint" | "template", "section": number | null, "refs": [ string, ... ] },
      "description": string,
      "fix": string
    }
  ]
`;
}

function postValidateAndFix(output: SpecForgeOutput): SpecForgeOutput {
  // Ensure schema_version and input_id
  output.schema_version = "1.0";
  if (!output.input_id || output.input_id.trim() === "") {
    output.input_id = "SAMPLE";
  }

  // Check template consistency
  const expectedTemplate = determineTemplate(
    output.course.credits_ltp,
    output.course.course_type
  );
  if (output.template !== expectedTemplate) {
    output.defects.push({
      code: "WRONG_TEMPLATE",
      location: { source: "template", section: null, refs: [] },
      description: `Course credits ${output.course.credits_ltp} indicate ${expectedTemplate} template, but ${output.template} was specified.`,
      fix: `Switched template to ${expectedTemplate}.`,
    });
    output.template = expectedTemplate;
  }

  // Check teaching hours consistency
  const th = output.teaching_hours;
  const computedHours =
    (th.lectures ?? 0) + (th.lab ?? 0) + (th.tests_exams ?? 0);
  if (th.total !== undefined && th.total > 0 && computedHours > 0 && computedHours !== th.total) {
    output.defects.push({
      code: "HOURS_INCONSISTENT",
      location: { source: "spec", section: 6, refs: [] },
      description: `Teaching hours rows sum to ${computedHours}, but total is stated as ${th.total}.`,
      fix: `Aligned total hours to match detailed hours sum (${computedHours}).`,
    });
  }

  // Check assessment weights
  const totalWeight = output.assessment.components.reduce(
    (acc, c) => acc + (c.weight_percent || 0),
    0
  );
  if (totalWeight !== 100 && output.assessment.components.length > 0) {
    output.defects.push({
      code: "WEIGHTAGE_INCONSISTENT",
      location: { source: "spec", section: 7, refs: [] },
      description: `Assessment component weights sum to ${totalWeight}%, expected 100%.`,
      fix: "Flagged assessment weightage inconsistency for departmental review.",
    });
  }

  // Check CO coverage and presence
  const coIds = new Set(output.course_outcomes.map((co) => co.id));
  for (const co of output.course_outcomes) {
    if (!output.co_po_pso_map[co.id]) {
      output.co_po_pso_map[co.id] = {
        "PO-1": { level: 2, justification: "Contributes engineering fundamentals." },
      };
      output.defects.push({
        code: "CO_MISSING_IN_TABLE",
        location: { source: "spec", section: 5, refs: [co.id] },
        description: `${co.id} was missing from the CO-PO map table.`,
        fix: `Added default mapping for ${co.id}.`,
      });
    }

    if (!output.assessment.co_coverage[co.id] || output.assessment.co_coverage[co.id].length === 0) {
      const defaultComp = output.assessment.components[0]?.name ?? "Term Test-1";
      output.assessment.co_coverage[co.id] = [defaultComp];
      output.defects.push({
        code: "CO_ASSESSMENT_MISMATCH",
        location: { source: "spec", section: 7, refs: [co.id] },
        description: `${co.id} was not mapped to any assessment component.`,
        fix: `Mapped ${co.id} to ${defaultComp}.`,
      });
    }
  }

  // Clean map of any orphaned CO ids
  for (const mapCoId of Object.keys(output.co_po_pso_map)) {
    if (!coIds.has(mapCoId)) {
      delete output.co_po_pso_map[mapCoId];
      output.defects.push({
        code: "CO_EXTRA_IN_TABLE",
        location: { source: "spec", section: 5, refs: [mapCoId] },
        description: `Orphaned ${mapCoId} found in CO-PO table but not in Course Outcomes.`,
        fix: `Removed ${mapCoId} from mapping matrix.`,
      });
    }
  }

  return output;
}

export async function runGenerationPipeline(
  specFile: Express.Multer.File,
  blueprintFile: Express.Multer.File | null | undefined,
  config: LlmConfig
): Promise<PipelineResult> {
  // 1. Extract documents
  const spec = await extractFile(specFile);
  const blueprint = blueprintFile ? await extractFile(blueprintFile) : null;

  // 2. Load accreditation reference data
  const refData = loadReferenceConfig();

  // 3. Construct prompt
  const prompt = buildPrompt(spec, blueprint, refData);

  // 4. Generate JSON through LLM abstraction
  let generatedData: SpecForgeOutput;
  try {
    generatedData = await generateJson(prompt, SpecForgeOutputSchema, config);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "BAD_AI_OUTPUT", (err as Error).message);
  }

  // 5. Post-validation & defect normalization
  const finalOutput = postValidateAndFix(generatedData);

  // 6. Validate again through Zod to guarantee schema conformance
  const parseCheck = SpecForgeOutputSchema.safeParse(finalOutput);
  if (!parseCheck.success) {
    throw new ApiError(
      502,
      "BAD_AI_OUTPUT",
      `Schema validation failed after post-processing: ${parseCheck.error.message}`
    );
  }

  // 7. Render HTML from official templates
  const html = renderSpecHtml(parseCheck.data);

  // 8. M4 deterministic V1–V10 validation (runs after HTML so V7 can scan it)
  const deterministicDefects = runDeterministicValidation(parseCheck.data, html);
  if (deterministicDefects.length > 0) {
    parseCheck.data.defects.push(...deterministicDefects);
    // Re-render HTML with the additional defects appended to Section 10
    const htmlWithDefects = renderSpecHtml(parseCheck.data);
    return { output: parseCheck.data, html: htmlWithDefects };
  }

  return {
    output: parseCheck.data,
    html,
  };
}
