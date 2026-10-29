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
- The blueprint is the AUTHORITATIVE source for Course Outcomes (COs) and unit-wise syllabus (Units).
- Use the EXACT CO statements and unit titles from the blueprint. Do NOT paraphrase them.
- The existing course specification is the source for course identity (code, title, department, course_type), credits_ltp, teaching hours, assessment weightages, and resources.
- If the spec's COs or syllabus differ from the blueprint, THE BLUEPRINT PREVAILS. Record each mismatch as a SUMMARY_SYLLABUS_MISMATCH or LABEL_OR_TITLE_MISMATCH defect.`
    : `No question-paper blueprint was provided.
Derive Course Outcomes (COs) and syllabus units from the course specification.
Record a defect with code "OTHER" noting "No blueprint supplied."`;

  return `You are an expert academic curriculum engineer and accreditation specialist for the SpecForge system.
Analyze the provided university course specification (and optional blueprint) and produce a COMPLETE, ACCURATE, and FULLY CORRECTED Course Specification JSON object.

${blueprintNotice}

==================== REFERENCE ACCREDITATION DATA ====================
PO/PSO Reference definitions (from config/po_pso.json — these are the ONLY valid POs and PSOs):
${JSON.stringify(refData, null, 2)}

VALID COLUMNS: PO-1 through PO-11, and PSO-1 and PSO-2 ONLY. Do NOT use PO-12 or PSO-3 or beyond.

==================== DEFECT DETECTION — MANDATORY SCAN ====================
You MUST scan the source document(s) thoroughly and record EVERY REAL defect found:

DEFECT CHECK 1 — CO_EXTRA_IN_TABLE:
- Inspect Section 3 (Course Outcomes) to determine the full list of defined Course Outcomes (e.g. CO-1 through CO-N).
- Inspect Section 5 (CO-PO map) and Section 7 (Assessment table).
- If any table references a CO identifier that was NOT defined in Section 3, record:
  {
    "code": "CO_EXTRA_IN_TABLE",
    "location": { "source": "spec", "section": <section_number_where_extra_co_appears>, "refs": ["<the_extra_co_id>"] },
    "description": "<the_extra_co_id> appears in Section <section_number> but is not defined in the Course Outcomes (Section 3).",
    "fix": "Removed <the_extra_co_id> from the table. Ensure only defined COs appear in tables."
  }

DEFECT CHECK 2 — PSO_COLUMN_MISMATCH:
- Compare all PSO columns present in the spec's Section 5 CO-PO-PSO map against the reference configuration (only defined PSOs are valid).
- If the spec includes any PSO column not in the reference data, record:
  {
    "code": "PSO_COLUMN_MISMATCH",
    "location": { "source": "spec", "section": 5, "refs": ["<the_invalid_pso_id>"] },
    "description": "The CO-PO-PSO map contains a <the_invalid_pso_id> column, which is not defined in the programme PSO reference data.",
    "fix": "Removed <the_invalid_pso_id> column from the CO-PO-PSO map."
  }

DEFECT CHECK 3 — HOURS_INCONSISTENT:
- Check Section 2 for declared 'Total Hours of Interaction' (or overall hours).
- Check Section 6 for the detailed hours breakdown and its sum.
- If the overall hours in Section 2 do not match the sum of detailed teaching hours in Section 6, record:
  {
    "code": "HOURS_INCONSISTENT",
    "location": { "source": "spec", "section": 2, "refs": ["Section 2: Total Hours of Interaction", "Section 6: Total Duration in Hours"] },
    "description": "The declared interaction hours in Section 2 do not match the detailed teaching hours breakdown in Section 6.",
    "fix": "Used the detailed breakdown sum as the authoritative figure for teaching_hours.total."
  }

DEFECT CHECK 4 — CO_ASSESSMENT_MISMATCH:
- Check if any defined CO is NOT assessed by any component in Section 7.
- Only record if a defined CO genuinely has no assessment coverage.

IMPORTANT: Only report defects that are ACTUALLY present in the source documents. Do NOT invent defects. Do NOT report a MAPPING_BLOOM_MISMATCH or MAPPING_UNSUPPORTED if the mapping follows the rules below.

==================== CO-PO-PSO MAPPING RULES ====================
1. Scale: 3 = Very strong, 2 = Strong, 1 = Moderate. Omit cell entirely when there is NO relation.
2. Bloom's level — assign based on the CO's leading action verb:
   L1 Remember (define, list, recall, state, identify, name)
   L2 Understand (explain, describe, summarise, classify, discuss, interpret)
   L3 Apply (apply, solve, use, implement, compute, demonstrate)
   L4 Analyse (analyse, compare, differentiate, examine, distinguish, select)
   L5 Evaluate (evaluate, assess, justify, critique, judge, recommend)
   L6 Create (design, develop, build, construct, formulate, propose)
3. Bloom ceiling RULE: A mapping strength CANNOT exceed the CO's Bloom level mapped to max 3:
   - bloom_level 1 (Remember): max strength = 1
   - bloom_level 2 (Understand): max strength = 2
   - bloom_level ≥ 3 (Apply, Analyse, Evaluate, Create): max strength = 3
4. PO-3 (Design/Development) and PO-5 (Engineering Tools) require PRACTICAL evidence:
   - PO-5 at strength ≥ 2: CO must involve practical tool usage, lab, or software tools.
   - PO-3 at strength 3: CO must involve design/development activities.
   - If course has lab hours > 0 or lab course type, PO-5 can be assigned for COs involving laboratory work.
5. PO-6 to PO-10: Only assign if EXPLICIT evidence exists in the syllabus or assessment. Otherwise, leave blank.
6. Every CO must map to AT LEAST one PO.
7. Every populated cell MUST have a concise 1-line justification (15-25 words) explaining the connection.
8. Columns: ONLY PO-1 through PO-11, PSO-1 and PSO-2. NEVER use PSO-3 or PO-12 or any other column.

==================== COURSE SUMMARY RULES ====================
The "summary" field in "course" must be a RICH, COMPREHENSIVE paragraph (minimum 120 words) that:
- States the course purpose, scope, and target audience
- Mentions the credit structure (Lecture:Tutorial:Practical) and delivery mode
- Summarizes the core topics systematically across ALL units in the syllabus
- Mentions specific methods, tools, or techniques covered in the units
- Outlines the professional and technical competencies students will acquire
- Is written in polished academic English suitable for a formal course catalogue
Do NOT use generic placeholder text. This summary must accurately describe the specific course being processed.

==================== TEACHING HOURS RULES ====================
- Use the DETAILED BREAKDOWN (Section 6) as the authoritative source for individual hours.
- lectures: face-to-face lecture hours
- lab: practical/laboratory/computer lab hours
- tests_exams: mid-terms + lab exam + written examination hours
- total: MUST equal lectures + lab + tests_exams (compute this yourself, do NOT copy the Section 2 "Total Hours of Interaction" if it differs)

==================== ASSESSMENT RULES ====================
- Derive assessment components and weights from the spec's assessment section.
- "components" weight_percent values MUST sum to exactly 100.
- For "co_coverage", include every defined CO (CO-1 through CO-N) and list which component names assess it.
- Refer to the assessment table's X marks to determine which components cover each CO.
- Component names must exactly match the names used in the "components" array.

==================== TEMPLATE SELECTION RULE ====================
- If practical credits in credits_ltp > 0 (e.g. "3:0:1") or course_type contains "laboratory", template MUST be "integrated".
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
Output ONLY a single JSON object. No markdown fences, no commentary, no extra keys:
{
  "schema_version": "1.0",
  "input_id": "SAMPLE",
  "template": "integrated" | "non_lab",
  "course": {
    "title": string,
    "code": string,
    "department": string,
    "credits_ltp": "L:T:P format e.g. 3:0:1",
    "course_type": string,
    "summary": string (minimum 120 words, covers all units, see SUMMARY RULES above)
  },
  "course_outcomes": [
    { "id": "CO-1", "statement": string (exact text from blueprint if available), "bloom_level": 1-6 }
  ],
  "units": [
    { "number": 1, "title": string (exact unit title and content from blueprint), "lab": string | null }
  ],
  "co_po_pso_map": {
    "CO-1": {
      "PO-1": { "level": 1|2|3, "justification": "one sentence justification" }
    }
  },
  "teaching_hours": { "lectures": number, "lab": number, "tests_exams": number, "total": number },
  "assessment": {
    "components": [ { "name": string, "weight_percent": number } ],
    "co_coverage": { "CO-1": [ "Component Name" ] }
  },
  "defects": [
    {
      "code": one of [CO_MISSING_IN_TABLE | CO_EXTRA_IN_TABLE | CO_ASSESSMENT_MISMATCH | PSO_COLUMN_MISMATCH | MAPPING_BLOOM_MISMATCH | MAPPING_UNSUPPORTED | WRONG_TEMPLATE | PLACEHOLDER_TEXT | SUMMARY_SYLLABUS_MISMATCH | LABEL_OR_TITLE_MISMATCH | HOURS_INCONSISTENT | WEIGHTAGE_INCONSISTENT | TYPO_OR_FORMAT | SECTION_NOT_IN_TEMPLATE | MARKS_INCONSISTENT | OTHER],
      "location": { "source": "spec" | "blueprint" | "template", "section": integer 1-12 or null, "refs": ["CO-6", "PSO-3", etc.] },
      "description": string (specific, factual, cites exact values from source),
      "fix": string (concrete action taken or recommended)
    }
  ]
}
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

  // Fix teaching hours: total MUST equal computed sum
  const th = output.teaching_hours;
  const lectures = th.lectures ?? 0;
  const lab = th.lab ?? 0;
  const tests = th.tests_exams ?? 0;
  const computedHours = lectures + lab + tests;
  if (computedHours > 0 && th.total !== computedHours) {
    const alreadyFlagged = output.defects.some((d) => d.code === "HOURS_INCONSISTENT");
    if (!alreadyFlagged) {
      output.defects.push({
        code: "HOURS_INCONSISTENT",
        location: { source: "spec", section: 2, refs: ["Section 2: Total Hours of Interaction", "Section 6: Total Duration in Hours"] },
        description: `The spec states 'Total Hours of Interaction: ${th.total}' in Section 2, but the detailed teaching hours breakdown in Section 6 sums to ${computedHours} hours (${lectures} lectures + ${lab} lab + ${tests} tests). These values are inconsistent.`,
        fix: `Used the detailed breakdown total (${computedHours} hours) as the authoritative figure for teaching_hours.total.`,
      });
    }
    output.teaching_hours = { ...th, total: computedHours };
  }

  // Fix assessment weights: must sum to 100
  const totalWeight = output.assessment.components.reduce(
    (acc, c) => acc + (c.weight_percent || 0),
    0
  );
  if (Math.abs(totalWeight - 100) > 0.01 && output.assessment.components.length > 0) {
    const alreadyFlagged = output.defects.some((d) => d.code === "WEIGHTAGE_INCONSISTENT");
    if (!alreadyFlagged) {
      output.defects.push({
        code: "WEIGHTAGE_INCONSISTENT",
        location: { source: "spec", section: 7, refs: [] },
        description: `Assessment component weights sum to ${totalWeight}%, expected 100%.`,
        fix: "Flagged assessment weightage inconsistency for departmental review.",
      });
    }
  }

  // Load valid PSO IDs (synchronous)
  const validPsoIds = new Set<string>();
  try {
    const cfgPath = path.resolve(process.cwd(), "config/po_pso.json");
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    for (const pso of cfg.psos ?? []) validPsoIds.add(pso.id);
  } catch {
    validPsoIds.add("PSO-1");
    validPsoIds.add("PSO-2");
  }

  // Remove invalid PSO columns from CO-PO map
  for (const [coId, row] of Object.entries(output.co_po_pso_map)) {
    for (const colKey of Object.keys(row)) {
      if (colKey.startsWith("PSO-") && !validPsoIds.has(colKey)) {
        delete (output.co_po_pso_map[coId] as any)[colKey];
      }
    }
  }

  // Check CO coverage and presence
  const coIds = new Set(output.course_outcomes.map((co) => co.id));
  for (const co of output.course_outcomes) {
    if (!output.co_po_pso_map[co.id]) {
      output.co_po_pso_map[co.id] = {
        "PO-1": { level: 2, justification: "Contributes to foundational engineering knowledge." },
      };
      output.defects.push({
        code: "CO_MISSING_IN_TABLE",
        location: { source: "spec", section: 5, refs: [co.id] },
        description: `${co.id} was missing from the CO-PO map table.`,
        fix: `Added default mapping for ${co.id}.`,
      });
    }

    if (!output.assessment.co_coverage[co.id] || output.assessment.co_coverage[co.id].length === 0) {
      const defaultComp = output.assessment.components[0]?.name ?? "Continuous Evaluation";
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

  // Clean assessment coverage of orphaned CO ids
  for (const covCoId of Object.keys(output.assessment.co_coverage)) {
    if (!coIds.has(covCoId)) {
      delete output.assessment.co_coverage[covCoId];
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
