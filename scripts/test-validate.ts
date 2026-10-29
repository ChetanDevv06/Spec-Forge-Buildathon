/**
 * scripts/test-validate.ts
 * M4 automated test suite — V1–V10 deterministic validation rules.
 *
 * Each test provides a minimal SpecForgeOutput fixture, calls the relevant
 * validator, and asserts the expected number / code of defects produced.
 * Run with:  npx tsx scripts/test-validate.ts
 */

import {
  v1CoCountConsistency,
  v2EveryCoMapsOnePo,
  v3EveryCoAssessed,
  v4NoOrphanedCoRefs,
  v5TeachingHoursSum,
  v6AssessmentWeightTotal,
  v7NoUnresolvedPlaceholders,
  v8PsoColumnsMatchConfig,
  v9MappingStrengthsAndBlooms,
  v10TemplateRule,
  runDeterministicValidation,
} from "../server/validate.js";
import { SpecForgeOutputSchema } from "../server/schema.js";
import { renderSpecHtml } from "../server/render.js";
import type { SpecForgeOutput, Defect } from "../server/schema.js";

// ──────────────────────────────────────────────────────────────────────────────
// Minimal valid fixture factory
// ──────────────────────────────────────────────────────────────────────────────

function makeOutput(overrides: Partial<SpecForgeOutput> = {}): SpecForgeOutput {
  const base: SpecForgeOutput = {
    schema_version: "1.0",
    input_id: "SAMPLE",
    template: "integrated",
    course: {
      title: "Advanced Software Engineering",
      code: "CSE401A",
      department: "Computer Science and Engineering",
      credits_ltp: "3:0:1",
      course_type: "Core Integrated",
      summary: "A comprehensive course on modern software engineering practices.",
    },
    course_outcomes: [
      { id: "CO-1", statement: "Identify core software engineering principles.", bloom_level: 1 },
      { id: "CO-2", statement: "Explain software development lifecycle models.", bloom_level: 2 },
      { id: "CO-3", statement: "Apply design patterns to solve engineering problems.", bloom_level: 3 },
    ],
    units: [
      { number: 1, title: "Software Process", lab: null },
      { number: 2, title: "Requirements Engineering", lab: "Requirements Elicitation Lab" },
      { number: 3, title: "Design Patterns", lab: "Pattern Implementation" },
    ],
    co_po_pso_map: {
      "CO-1": { "PO-1": { level: 1, justification: "Applies engineering fundamentals." }, "PSO-1": { level: 1, justification: "Computing knowledge." } },
      "CO-2": { "PO-1": { level: 2, justification: "Engineering knowledge of SDLC." }, "PO-2": { level: 2, justification: "Problem analysis." } },
      "CO-3": { "PO-3": { level: 3, justification: "Design solutions using patterns." }, "PO-5": { level: 3, justification: "Tool and framework usage." }, "PSO-2": { level: 3, justification: "Software development with tools." } },
    },
    teaching_hours: { lectures: 42, lab: 28, tests_exams: 5, total: 75 },
    assessment: {
      components: [
        { name: "Continuous Evaluation", weight_percent: 60 },
        { name: "Semester End Exam", weight_percent: 40 },
      ],
      co_coverage: {
        "CO-1": ["Continuous Evaluation"],
        "CO-2": ["Continuous Evaluation", "Semester End Exam"],
        "CO-3": ["Continuous Evaluation", "Semester End Exam"],
      },
    },
    defects: [],
  };
  return { ...base, ...overrides };
}

// ──────────────────────────────────────────────────────────────────────────────
// Test runner
// ──────────────────────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true, details: "OK" });
  } catch (err) {
    results.push({ name, passed: false, details: (err as Error).message });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertHasCode(defects: Defect[], code: string) {
  const found = defects.some((d) => d.code === code);
  assert(found, `Expected defect with code "${code}" but got: [${defects.map((d) => d.code).join(", ")}]`);
}

function assertNoCode(defects: Defect[], code: string) {
  const found = defects.some((d) => d.code === code);
  assert(!found, `Did NOT expect defect code "${code}" but it was present.`);
}

// ──────────────────────────────────────────────────────────────────────────────
// V1 — CO count consistency
// ──────────────────────────────────────────────────────────────────────────────

test("V1 PASS: CO counts consistent across Sections 3, 5 and 7", () => {
  const out = makeOutput();
  const defects = v1CoCountConsistency(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V1 FAIL: Extra CO in co_po_pso_map vs course_outcomes", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-99"] = { "PO-1": { level: 1, justification: "extra" } };
  const defects = v1CoCountConsistency(out);
  assertHasCode(defects, "CO_MISSING_IN_TABLE");
});

test("V1 FAIL: Missing CO in assessment.co_coverage", () => {
  const out = makeOutput();
  delete out.assessment.co_coverage["CO-3"];
  const defects = v1CoCountConsistency(out);
  assertHasCode(defects, "CO_ASSESSMENT_MISMATCH");
});

test("V1 FAIL: Multiple COs missing from map", () => {
  const out = makeOutput();
  out.course_outcomes.push(
    { id: "CO-4", statement: "Analyse test strategies.", bloom_level: 4 },
    { id: "CO-5", statement: "Evaluate security threats.", bloom_level: 5 }
  );
  const defects = v1CoCountConsistency(out);
  assertHasCode(defects, "CO_MISSING_IN_TABLE");
  assertHasCode(defects, "CO_ASSESSMENT_MISMATCH");
});

// ──────────────────────────────────────────────────────────────────────────────
// V2 — Every CO maps to at least one PO
// ──────────────────────────────────────────────────────────────────────────────

test("V2 PASS: All COs have at least one PO mapping", () => {
  const out = makeOutput();
  const defects = v2EveryCoMapsOnePo(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V2 FAIL: CO with only PSO mapping (no PO)", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-1"] = { "PSO-1": { level: 1, justification: "Only PSO." } };
  const defects = v2EveryCoMapsOnePo(out);
  assertHasCode(defects, "CO_MISSING_IN_TABLE");
});

test("V2 FAIL: CO with empty mapping row", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-2"] = {};
  const defects = v2EveryCoMapsOnePo(out);
  assertHasCode(defects, "CO_MISSING_IN_TABLE");
});

// ──────────────────────────────────────────────────────────────────────────────
// V3 — Every CO is assessed
// ──────────────────────────────────────────────────────────────────────────────

test("V3 PASS: All COs appear in co_coverage", () => {
  const out = makeOutput();
  const defects = v3EveryCoAssessed(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V3 FAIL: CO-1 not in co_coverage", () => {
  const out = makeOutput();
  delete out.assessment.co_coverage["CO-1"];
  const defects = v3EveryCoAssessed(out);
  assertHasCode(defects, "CO_ASSESSMENT_MISMATCH");
  assert(defects[0].location.refs?.includes("CO-1") === true, "refs should include CO-1");
});

test("V3 FAIL: CO with empty components array", () => {
  const out = makeOutput();
  out.assessment.co_coverage["CO-2"] = [];
  const defects = v3EveryCoAssessed(out);
  assertHasCode(defects, "CO_ASSESSMENT_MISMATCH");
});

// ──────────────────────────────────────────────────────────────────────────────
// V4 — No orphaned CO references
// ──────────────────────────────────────────────────────────────────────────────

test("V4 PASS: No orphaned CO references", () => {
  const out = makeOutput();
  const defects = v4NoOrphanedCoRefs(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V4 FAIL: Orphaned CO in co_po_pso_map (Sec 5)", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-GHOST"] = { "PO-1": { level: 1, justification: "ghost" } };
  const defects = v4NoOrphanedCoRefs(out);
  assertHasCode(defects, "CO_EXTRA_IN_TABLE");
  assert(defects[0].location.section === 5, "section should be 5");
});

test("V4 FAIL: Orphaned CO in co_coverage (Sec 7)", () => {
  const out = makeOutput();
  out.assessment.co_coverage["CO-GHOST"] = ["Continuous Evaluation"];
  const defects = v4NoOrphanedCoRefs(out);
  assertHasCode(defects, "CO_EXTRA_IN_TABLE");
  assert(defects.some((d) => d.location.section === 7), "section should be 7");
});

// ──────────────────────────────────────────────────────────────────────────────
// V5 — Teaching hours sum
// ──────────────────────────────────────────────────────────────────────────────

test("V5 PASS: Hours add up correctly", () => {
  const out = makeOutput();
  // 42 + 28 + 5 = 75 ✓
  const defects = v5TeachingHoursSum(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V5 FAIL: Declared total does not match computed sum", () => {
  const out = makeOutput({ teaching_hours: { lectures: 40, lab: 20, tests_exams: 5, total: 90 } });
  const defects = v5TeachingHoursSum(out);
  assertHasCode(defects, "HOURS_INCONSISTENT");
});

test("V5 PASS: No total declared — skip check", () => {
  const out = makeOutput({ teaching_hours: { lectures: 40, lab: 20, tests_exams: 5 } });
  const defects = v5TeachingHoursSum(out);
  assert(defects.length === 0, "Should not flag when total is absent");
});

// ──────────────────────────────────────────────────────────────────────────────
// V6 — Assessment weightages
// ──────────────────────────────────────────────────────────────────────────────

test("V6 PASS: Weights total 100%", () => {
  const out = makeOutput();
  // 60 + 40 = 100 ✓
  const defects = v6AssessmentWeightTotal(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V6 FAIL: Weights sum to 90%", () => {
  const out = makeOutput();
  out.assessment.components = [
    { name: "CE", weight_percent: 50 },
    { name: "SEE", weight_percent: 40 },
  ];
  const defects = v6AssessmentWeightTotal(out);
  assertHasCode(defects, "WEIGHTAGE_INCONSISTENT");
});

test("V6 FAIL: Weights sum to 110%", () => {
  const out = makeOutput();
  out.assessment.components = [
    { name: "CE", weight_percent: 70 },
    { name: "SEE", weight_percent: 40 },
  ];
  const defects = v6AssessmentWeightTotal(out);
  assertHasCode(defects, "WEIGHTAGE_INCONSISTENT");
});

// ──────────────────────────────────────────────────────────────────────────────
// V7 — No unresolved placeholders
// ──────────────────────────────────────────────────────────────────────────────

test("V7 PASS: Clean HTML has no placeholders", () => {
  const out = makeOutput();
  const html = renderSpecHtml(out);
  const defects = v7NoUnresolvedPlaceholders(out, html);
  const filtered = defects.filter((d) => d.code === "PLACEHOLDER_TEXT");
  assert(filtered.length === 0, `Expected 0 PLACEHOLDER_TEXT defects, got ${filtered.length}: ${filtered.map(d => d.description).join("; ")}`);
});

test("V7 FAIL: HTML with {{ mustache }} placeholder", () => {
  const html = "<p>Course: {{ COURSE_NAME }}</p>";
  const out = makeOutput();
  const defects = v7NoUnresolvedPlaceholders(out, html);
  assertHasCode(defects, "PLACEHOLDER_TEXT");
});

test("V7 FAIL: HTML with leftover sample text AIC304A", () => {
  const html = "<p>This is for AIC304A course by Gonzalez.</p>";
  const out = makeOutput();
  const defects = v7NoUnresolvedPlaceholders(out, html);
  assertHasCode(defects, "PLACEHOLDER_TEXT");
});

test("V7 PASS: Sample text belongs to actual course code", () => {
  const out = makeOutput({ course: { ...makeOutput().course, code: "AIC304A" } });
  const html = "<p>Course code: AIC304A</p>";
  const defects = v7NoUnresolvedPlaceholders(out, html);
  // AIC304A is the actual course code — should not be flagged
  const sampleFlag = defects.filter((d) => d.location.refs?.includes("AIC304A"));
  assert(sampleFlag.length === 0, "Should not flag sample string matching actual course code");
});

// ──────────────────────────────────────────────────────────────────────────────
// V8 — PSO columns match config
// ──────────────────────────────────────────────────────────────────────────────

test("V8 PASS: Only PSO-1 and PSO-2 used", () => {
  const out = makeOutput();
  const defects = v8PsoColumnsMatchConfig(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V8 FAIL: PSO-5 used but not in config", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-1"]["PSO-5"] = { level: 1, justification: "invalid PSO" };
  const defects = v8PsoColumnsMatchConfig(out);
  assertHasCode(defects, "PSO_COLUMN_MISMATCH");
  assert(defects[0].location.refs?.includes("PSO-5") === true, "refs should include PSO-5");
});

test("V8 FAIL: Incorrect PSO column across multiple COs", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-1"]["PSO-99"] = { level: 2, justification: "invalid" };
  out.co_po_pso_map["CO-2"]["PSO-99"] = { level: 1, justification: "invalid" };
  const defects = v8PsoColumnsMatchConfig(out);
  assert(defects.length === 2, `Expected 2 defects, got ${defects.length}`);
});

// ──────────────────────────────────────────────────────────────────────────────
// V9 — Mapping strengths and Bloom ceilings
// ──────────────────────────────────────────────────────────────────────────────

test("V9 PASS: All strengths valid; Bloom ceilings respected", () => {
  // CO-1 L1 → PO-1: strength 1 (ceiling=1) ✓
  // CO-2 L2 → PO-1: strength 2 (ceiling=2) ✓
  // CO-3 L3 → PO-3: strength 3 (ceiling=3), course has lab ✓
  const out = makeOutput();
  const defects = v9MappingStrengthsAndBlooms(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}: ${defects.map(d => d.description).join("; ")}`);
});

test("V9 FAIL: Bloom ceiling exceeded — L1 CO with strength 3", () => {
  const out = makeOutput();
  out.co_po_pso_map["CO-1"] = { "PO-1": { level: 3, justification: "Overblown for L1 CO." } };
  const defects = v9MappingStrengthsAndBlooms(out);
  assertHasCode(defects, "MAPPING_BLOOM_MISMATCH");
  assert(defects[0].location.refs?.includes("CO-1") === true, "refs should include CO-1");
});

test("V9 FAIL: PO-5 strength 3 without practical evidence", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:1:0", course_type: "Core Theory" },
    template: "non_lab",
    teaching_hours: { lectures: 45, lab: 0, tests_exams: 15, total: 60 },
  });
  // CO-3 bloom=3, strength=3 on PO-5 without lab → violation
  out.co_po_pso_map["CO-3"] = { "PO-1": { level: 2, justification: "ok" }, "PO-5": { level: 3, justification: "tool usage but no lab" } };
  const defects = v9MappingStrengthsAndBlooms(out);
  assertHasCode(defects, "MAPPING_UNSUPPORTED");
});

test("V9 FAIL: PO-3 strength 3 without practical evidence", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:0:0", course_type: "Core Theory" },
    template: "non_lab",
    teaching_hours: { lectures: 45, lab: 0, tests_exams: 5, total: 50 },
  });
  out.co_po_pso_map["CO-3"] = { "PO-3": { level: 3, justification: "design without lab" } };
  const defects = v9MappingStrengthsAndBlooms(out);
  assertHasCode(defects, "MAPPING_UNSUPPORTED");
});

test("V9 PASS: Non-lab course with PO-5 strength 2 is valid", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:1:0", course_type: "Core Theory" },
    template: "non_lab",
    teaching_hours: { lectures: 45, lab: 0, tests_exams: 15, total: 60 },
  });
  out.co_po_pso_map["CO-3"] = { "PO-1": { level: 2, justification: "ok" }, "PO-5": { level: 2, justification: "moderate tool usage" } };
  const defects = v9MappingStrengthsAndBlooms(out);
  assertNoCode(defects, "MAPPING_UNSUPPORTED");
});

// ──────────────────────────────────────────────────────────────────────────────
// V10 — Template rule
// ──────────────────────────────────────────────────────────────────────────────

test("V10 PASS: Integrated template for 3:0:1 course", () => {
  // base fixture: credits_ltp=3:0:1, template=integrated
  const out = makeOutput();
  const defects = v10TemplateRule(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V10 PASS: Non-lab template for 3:1:0 theory course", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:1:0", course_type: "Core Theory" },
    template: "non_lab",
  });
  const defects = v10TemplateRule(out);
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}`);
});

test("V10 FAIL: Non-lab template but practical credits > 0", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:0:1", course_type: "Core Theory" },
    template: "non_lab",
  });
  const defects = v10TemplateRule(out);
  assertHasCode(defects, "WRONG_TEMPLATE");
});

test("V10 PASS: Override already documented in defects", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:0:1", course_type: "Core Theory" },
    template: "non_lab",
    defects: [
      {
        code: "WRONG_TEMPLATE",
        location: { source: "template", section: null, refs: [] },
        description: "Override: non_lab selected for historical reasons.",
        fix: "Documented.",
      },
    ],
  });
  const defects = v10TemplateRule(out);
  // Already documented — should not generate a duplicate
  assert(defects.length === 0, `Expected 0 defects (already documented), got ${defects.length}`);
});

// ──────────────────────────────────────────────────────────────────────────────
// Integration — runDeterministicValidation orchestrator
// ──────────────────────────────────────────────────────────────────────────────

test("INTEGRATION PASS: Valid output produces no new defects", () => {
  const out = makeOutput();
  const defects = runDeterministicValidation(out, "");
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}: ${defects.map(d => d.code).join(", ")}`);
});

test("INTEGRATION PASS: Valid non-lab output produces no new defects", () => {
  const out = makeOutput({
    course: { ...makeOutput().course, credits_ltp: "3:1:0", course_type: "Core Theory" },
    template: "non_lab",
    teaching_hours: { lectures: 45, lab: 0, tests_exams: 15, total: 60 },
    units: makeOutput().units.map((u) => ({ ...u, lab: null })),
    co_po_pso_map: {
      "CO-1": { "PO-1": { level: 1, justification: "Engineering knowledge." } },
      "CO-2": { "PO-1": { level: 2, justification: "Problem analysis." }, "PO-2": { level: 2, justification: "Formulation." } },
      "CO-3": { "PO-1": { level: 3, justification: "Apply engineering." }, "PSO-1": { level: 2, justification: "Computing." } },
    },
  });
  const defects = runDeterministicValidation(out, "");
  assert(defects.length === 0, `Expected 0 defects, got ${defects.length}: ${defects.map(d => d.code + ": " + d.description).join("; ")}`);
});

test("INTEGRATION FAIL: Output with multiple defects returns all applicable issues", () => {
  const out = makeOutput();
  // V5: wrong total
  out.teaching_hours = { lectures: 40, lab: 20, tests_exams: 5, total: 999 };
  // V6: weights wrong
  out.assessment.components = [{ name: "CE", weight_percent: 50 }, { name: "SEE", weight_percent: 30 }];
  const defects = runDeterministicValidation(out, "");
  assertHasCode(defects, "HOURS_INCONSISTENT");
  assertHasCode(defects, "WEIGHTAGE_INCONSISTENT");
  assert(defects.length >= 2, `Expected ≥2 defects, got ${defects.length}`);
});

test("INTEGRATION: Deduplication skips existing defect codes", () => {
  const out = makeOutput();
  // Pre-populate a V6 defect
  out.defects = [
    {
      code: "WEIGHTAGE_INCONSISTENT",
      location: { source: "spec", section: 7, refs: [] },
      description: "Already known.",
      fix: "Already fixed.",
    },
  ];
  out.assessment.components = [{ name: "CE", weight_percent: 50 }, { name: "SEE", weight_percent: 30 }];
  const defects = runDeterministicValidation(out, "");
  // Should be deduplicated — same code+refs signature
  assertNoCode(defects, "WEIGHTAGE_INCONSISTENT");
});

test("INTEGRATION: Schema-invalid output (Zod parse test)", () => {
  const badData = { schema_version: "1.0", input_id: "SAMPLE", template: "integrated" };
  const result = SpecForgeOutputSchema.safeParse(badData);
  assert(!result.success, "Schema parse should fail for incomplete data");
});

test("INTEGRATION: Regression — existing generation and rendering flow unchanged", () => {
  // renderSpecHtml should still work with a valid SpecForgeOutput
  const out = makeOutput();
  const html = renderSpecHtml(out);
  assert(typeof html === "string" && html.length > 1000, "renderSpecHtml should return substantial HTML");
  assert(html.includes("Advanced Software Engineering"), "HTML should contain course title");
  assert(html.includes("CO-1") && html.includes("CO-3"), "HTML should contain CO references");
  assert(html.includes("[L1: Remember]"), "HTML should contain Bloom badge");
});

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n=================== M4 V1–V10 VALIDATION TEST RESULTS ===================");
let allPassed = true;
let passed = 0;
let failed = 0;
for (const r of results) {
  const icon = r.passed ? "[PASS]" : "[FAIL]";
  console.log(`${icon} ${r.name}`);
  if (!r.passed) {
    console.log(`       ${r.details}`);
    allPassed = false;
    failed++;
  } else {
    passed++;
  }
}
console.log("==========================================================================");
console.log(`\n${passed}/${results.length} tests passed. ${failed > 0 ? `${failed} FAILED.` : "All good."}\n`);

if (!allPassed) process.exit(1);
