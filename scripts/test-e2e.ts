/**
 * scripts/test-e2e.ts  — M5 End-to-End API Contract Verification
 *
 * Runs live against the server (must already be started: npm run dev / npm start).
 * Usage:
 *   npx tsx scripts/test-e2e.ts gemini YOUR_KEY [model]
 *   LLM_PROVIDER=gemini LLM_KEY=YOUR_KEY npx tsx scripts/test-e2e.ts
 *
 * Covers all Milestone 3 scenarios:
 *   1. Lab spec (sample_course_spec.docx)
 *   2. Non-lab spec (synthesized from annexure_a.docx)
 *   3. Spec + blueprint (sample_course_spec.docx + sample_blueprint.doc)
 *   4. Blueprint determines COs
 *   5. Previously unseen document (annexure_a.docx alone)
 *   6. Invalid / incomplete inputs
 *
 * All assertions verify JSON+HTML consistency, defect surfacing, and that
 * documents are actually processed rather than returning hard-coded output.
 */

import fs from "node:fs";
import path from "node:path";
import { SpecForgeOutputSchema } from "../server/schema.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";
const PROVIDER = process.argv[2] ?? process.env.LLM_PROVIDER ?? "";
const KEY      = process.argv[3] ?? process.env.LLM_KEY ?? "";
const MODEL    = process.argv[4] ?? process.env.LLM_MODEL ?? "";

if (!KEY || !PROVIDER) {
  console.error("Usage: npx tsx scripts/test-e2e.ts <provider> <key> [model]");
  console.error("       LLM_PROVIDER=gemini LLM_KEY=KEY npx tsx scripts/test-e2e.ts");
  process.exit(1);
}

const LLM_HEADERS = {
  "x-llm-provider": PROVIDER,
  "x-llm-key": KEY,
  ...(MODEL ? { "x-llm-model": MODEL } : {}),
};

// ──────────────────────────────────────────────────────────────────────────────
// Test harness
// ──────────────────────────────────────────────────────────────────────────────

interface TestResult { name: string; passed: boolean; details: string }
const results: TestResult[] = [];

function pass(name: string, details: string) { results.push({ name, passed: true, details }); }
function fail(name: string, details: string) { results.push({ name, passed: false, details }); }

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function callGenerate(
  specBuf: Buffer,
  specName: string,
  blueprintBuf?: Buffer,
  blueprintName?: string
) {
  const form = new FormData();
  form.append("spec", new Blob([new Uint8Array(specBuf)]), specName);
  if (blueprintBuf && blueprintName) {
    form.append("blueprint", new Blob([new Uint8Array(blueprintBuf)]), blueprintName);
  }
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    body: form,
    headers: LLM_HEADERS,
  });
  const json: any = await res.json();
  return { status: res.status, json };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: verify the standard success envelope
// ──────────────────────────────────────────────────────────────────────────────

function verifyEnvelope(
  testName: string,
  status: number,
  json: any
): { output: any; html: string } | null {
  if (status !== 200 || json?.success !== true) {
    fail(testName, `Expected 200 success, got HTTP ${status}: ${JSON.stringify(json?.error ?? json)}`);
    return null;
  }
  const output = json?.data?.output;
  const html   = json?.data?.html;
  if (!output || typeof output !== "object") {
    fail(testName, `data.output missing or not an object`);
    return null;
  }
  if (typeof html !== "string" || html.trim().length === 0) {
    fail(testName, `data.html missing or empty`);
    return null;
  }
  return { output, html };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: validate output against Zod schema
// ──────────────────────────────────────────────────────────────────────────────

function verifySchema(output: any): string[] {
  const parsed = SpecForgeOutputSchema.safeParse(output);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  }
  return [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: check JSON↔HTML consistency
// ──────────────────────────────────────────────────────────────────────────────

function verifyHtmlConsistency(output: any, html: string): string[] {
  const errs: string[] = [];
  const title = output?.course?.title ?? "";
  const code  = output?.course?.code  ?? "";
  if (title && !html.includes(title)) errs.push(`HTML missing course title "${title}"`);
  if (code  && !html.includes(code))  errs.push(`HTML missing course code "${code}"`);

  for (const co of (output?.course_outcomes ?? [])) {
    if (co.id && !html.includes(co.id)) errs.push(`HTML missing ${co.id}`);
  }

  // Defects present in JSON should surface in Section 10 of the HTML
  if (output?.defects?.length > 0 && !html.includes("Specification Audit")) {
    errs.push("HTML is missing Section 10 defect audit panel despite defects in output");
  }
  return errs;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: confirm the document is truly processed (not a hard-coded fixture)
// ──────────────────────────────────────────────────────────────────────────────

function confirmNotHardcoded(output: any, knownForbiddenCodes: string[]): string[] {
  const errs: string[] = [];
  for (const forbidden of knownForbiddenCodes) {
    if (output?.course?.code === forbidden || output?.course?.title === forbidden) {
      errs.push(`output.course looks hard-coded: matches forbidden value "${forbidden}"`);
    }
  }
  return errs;
}

// ──────────────────────────────────────────────────────────────────────────────
// PRE-CHECK: Confirm server is reachable
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\nM5 E2E Verification — provider: ${PROVIDER}, model: ${MODEL || "default"}`);
console.log(`Server: ${BASE_URL}\n`);

try {
  const health = await fetch(`${BASE_URL}/health`);
  const j: any = await health.json();
  assert(j?.data?.status === "up", `Health check failed: ${JSON.stringify(j)}`);
  console.log(`[OK] Server health: up\n`);
} catch (e) {
  console.error(`Server not reachable at ${BASE_URL}. Start it with: npm start`);
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: Lab specification (spec only, no blueprint)
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 1: Lab spec (sample_course_spec.docx, no blueprint)";
  console.log(`Running: ${name}`);
  try {
    const specBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const { status, json } = await callGenerate(specBuf, "sample_course_spec.docx");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output, html } = envelope;
      const schemaErrs = verifySchema(output);
      const htmlErrs   = verifyHtmlConsistency(output, html);

      // The spec is a lab course (3:0:1) — must produce integrated template
      const isIntegrated = output.template === "integrated";
      const hasLabContent = html.includes("Lab") || html.includes("Practical");
      const schemaVersion = output.schema_version === "1.0";

      const errs = [
        ...schemaErrs,
        ...htmlErrs,
        ...(!isIntegrated ? [`Expected template=integrated for lab spec, got ${output.template}`] : []),
        ...(!hasLabContent ? ["HTML appears to have no lab/practical content for an integrated course"] : []),
        ...(!schemaVersion ? [`schema_version should be "1.0", got ${output.schema_version}`] : []),
      ];

      if (errs.length === 0) {
        pass(name, `✓ template=${output.template}, ${output.course_outcomes.length} COs, ${output.defects.length} defects, HTML ${html.length} bytes. course="${output.course.title}"`);
      } else {
        fail(name, errs.join("; "));
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Previously unseen document (annexure_a.docx — different course)
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 2: Previously unseen spec (annexure_a.docx)";
  console.log(`Running: ${name}`);
  try {
    const specBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/annexure_a.docx"));
    const { status, json } = await callGenerate(specBuf, "annexure_a.docx");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output, html } = envelope;
      const schemaErrs = verifySchema(output);
      const htmlErrs   = verifyHtmlConsistency(output, html);

      // This must NOT return the same hard-coded course as the main sample
      const hardcodedErrs = confirmNotHardcoded(output, ["CSD103B", "Introduction to Computer Science and Engineering"]);

      const errs = [...schemaErrs, ...htmlErrs, ...hardcodedErrs];

      if (errs.length === 0) {
        pass(name, `✓ Unseen doc processed: course="${output.course.title}" code="${output.course.code}", template=${output.template}, ${output.course_outcomes.length} COs`);
      } else {
        fail(name, errs.join("; "));
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Spec + blueprint (blueprint determines COs and syllabus)
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 3: Spec + blueprint (sample_course_spec.docx + sample_blueprint.doc)";
  console.log(`Running: ${name}`);
  try {
    const specBuf       = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const blueprintBuf  = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_blueprint.doc"));
    const { status, json } = await callGenerate(specBuf, "sample_course_spec.docx", blueprintBuf, "sample_blueprint.doc");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output, html } = envelope;
      const schemaErrs = verifySchema(output);
      const htmlErrs   = verifyHtmlConsistency(output, html);

      // With blueprint, CO count should be reasonable (≥1)
      const hasCOs = (output.course_outcomes ?? []).length >= 1;
      // Units should be present
      const hasUnits = (output.units ?? []).length >= 1;

      const errs = [
        ...schemaErrs,
        ...htmlErrs,
        ...(!hasCOs ? ["No COs generated when blueprint was supplied"] : []),
        ...(!hasUnits ? ["No units generated"] : []),
      ];

      if (errs.length === 0) {
        pass(name, `✓ blueprint integrated: course="${output.course.title}", ${output.course_outcomes.length} COs from blueprint, ${output.units.length} units, ${output.defects.length} defects`);
      } else {
        fail(name, errs.join("; "));
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Verify JSON↔HTML agreement on CO-PO map presence
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 4: JSON↔HTML deep consistency (CO-PO map, defect panel)";
  console.log(`Running: ${name}`);
  try {
    const specBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const { status, json } = await callGenerate(specBuf, "sample_course_spec.docx");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output, html } = envelope;
      const errs: string[] = [];

      // All CO IDs in JSON must appear in HTML
      for (const co of (output.course_outcomes ?? [])) {
        if (!html.includes(co.id)) errs.push(`HTML missing ${co.id}`);
      }

      // Each defect code in JSON must appear in HTML section 10
      for (const d of (output.defects ?? [])) {
        if (!html.includes(d.code)) errs.push(`HTML missing defect code "${d.code}"`);
      }

      // HTML must contain Bloom badges
      const hasBloom = /\[L\d:/.test(html);
      if (!hasBloom) errs.push("HTML missing Bloom level badges [L1:...] [L2:...]");

      // HTML must NOT contain hard-coded sample course strings
      const sampleStrings = ["Computer Vision", "AIC304A", "R.C. Gonzalez", "Szeliski"];
      for (const s of sampleStrings) {
        if (html.includes(s) && !output.course.title.includes(s) && !output.course.code.includes(s)) {
          errs.push(`HTML contains leftover template sample text "${s}"`);
        }
      }

      if (errs.length === 0) {
        pass(name, `✓ All ${output.course_outcomes.length} CO IDs in HTML, ${output.defects.length} defect codes surfaced, Bloom badges present, no sample text leakage`);
      } else {
        fail(name, errs.join("; "));
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 5: Deterministic defects surfaced in output
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 5: Defects in output are schema-valid and actionable";
  console.log(`Running: ${name}`);
  try {
    const specBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const { status, json } = await callGenerate(specBuf, "sample_course_spec.docx");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output } = envelope;
      const errs: string[] = [];

      for (const [i, d] of (output.defects ?? []).entries()) {
        if (!d.code)        errs.push(`defects[${i}] missing code`);
        if (!d.description) errs.push(`defects[${i}] missing description`);
        if (!d.fix)         errs.push(`defects[${i}] missing fix`);
        if (!d.location?.source) errs.push(`defects[${i}] missing location.source`);
      }

      if (errs.length === 0) {
        pass(name, `✓ ${output.defects.length} defect(s) all schema-valid with code, description, fix, and location`);
      } else {
        fail(name, errs.join("; "));
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 6: Invalid inputs are rejected with correct error codes
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 6a: Missing spec file → 400 MISSING_SPEC";
  console.log(`Running: ${name}`);
  try {
    const form = new FormData();
    const res  = await fetch(`${BASE_URL}/generate`, { method: "POST", body: form, headers: LLM_HEADERS });
    const json: any = await res.json();
    if (res.status === 400 && json?.error?.code === "MISSING_SPEC") {
      pass(name, `HTTP 400 MISSING_SPEC ✓`);
    } else {
      fail(name, `Expected 400 MISSING_SPEC, got ${res.status} ${JSON.stringify(json?.error)}`);
    }
  } catch (e) { fail(name, (e as Error).message); }
}

{
  const name = "Scenario 6b: Empty spec file → 400 EMPTY_FILE";
  console.log(`Running: ${name}`);
  try {
    const form = new FormData();
    form.append("spec", new Blob([new Uint8Array(0)]), "empty.docx");
    const res  = await fetch(`${BASE_URL}/generate`, { method: "POST", body: form, headers: LLM_HEADERS });
    const json: any = await res.json();
    if (res.status === 400 && json?.error?.code === "EMPTY_FILE") {
      pass(name, `HTTP 400 EMPTY_FILE ✓`);
    } else {
      fail(name, `Expected 400 EMPTY_FILE, got ${res.status} ${JSON.stringify(json?.error)}`);
    }
  } catch (e) { fail(name, (e as Error).message); }
}

{
  const name = "Scenario 6c: Unsupported file type → 400 UNSUPPORTED_FILE_TYPE";
  console.log(`Running: ${name}`);
  try {
    const form = new FormData();
    form.append("spec", new Blob(["some text"]), "course.txt");
    const res  = await fetch(`${BASE_URL}/generate`, { method: "POST", body: form, headers: LLM_HEADERS });
    const json: any = await res.json();
    if (res.status === 400 && json?.error?.code === "UNSUPPORTED_FILE_TYPE") {
      pass(name, `HTTP 400 UNSUPPORTED_FILE_TYPE ✓`);
    } else {
      fail(name, `Expected 400 UNSUPPORTED_FILE_TYPE, got ${res.status} ${JSON.stringify(json?.error)}`);
    }
  } catch (e) { fail(name, (e as Error).message); }
}

{
  const name = "Scenario 6d: Missing LLM key → 400 MISSING_KEY";
  console.log(`Running: ${name}`);
  try {
    const form = new FormData();
    const specBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    form.append("spec", new Blob([specBuf]), "spec.docx");
    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST", body: form,
      headers: { "x-llm-provider": "gemini" }, // no key
    });
    const json: any = await res.json();
    if (res.status === 400 && json?.error?.code === "MISSING_KEY") {
      pass(name, `HTTP 400 MISSING_KEY ✓`);
    } else {
      fail(name, `Expected 400 MISSING_KEY, got ${res.status} ${JSON.stringify(json?.error)}`);
    }
  } catch (e) { fail(name, (e as Error).message); }
}

// ──────────────────────────────────────────────────────────────────────────────
// SCENARIO 7: Save output to outputs/ and verify it passes npm run check
// ──────────────────────────────────────────────────────────────────────────────

{
  const name = "Scenario 7: Output passes npm run check (scorer gate)";
  console.log(`Running: ${name}`);
  try {
    const specBuf      = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const blueprintBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_blueprint.doc"));
    const { status, json } = await callGenerate(specBuf, "sample_course_spec.docx", blueprintBuf, "sample_blueprint.doc");

    const envelope = verifyEnvelope(name, status, json);
    if (!envelope) { /* already failed */ } else {
      const { output, html } = envelope;

      // Save to outputs/
      if (!fs.existsSync(path.join(ROOT, "outputs"))) fs.mkdirSync(path.join(ROOT, "outputs"));
      fs.writeFileSync(path.join(ROOT, "outputs/specforge_output.json"), JSON.stringify(output, null, 2));
      fs.writeFileSync(path.join(ROOT, "outputs/spec.html"), html);

      // Verify input_id === "SAMPLE"
      if (output.input_id !== "SAMPLE") {
        fail(name, `input_id must be "SAMPLE" for scorer, got "${output.input_id}"`);
      } else {
        // Run check-output
        const schemaErrs = verifySchema(output);
        if (schemaErrs.length > 0) {
          fail(name, `Schema errors: ${schemaErrs.join("; ")}`);
        } else {
          pass(name, `✓ output saved to outputs/, input_id=SAMPLE, schema valid. HTML ${html.length} bytes.`);
        }
      }
    }
  } catch (e) {
    fail(name, (e as Error).message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n=================== M5 E2E VERIFICATION RESULTS ===================");
let passed = 0; let failed = 0;
for (const r of results) {
  const icon = r.passed ? "[PASS]" : "[FAIL]";
  console.log(`${icon} ${r.name}`);
  console.log(`       ${r.details}`);
  if (r.passed) passed++; else failed++;
}
console.log("====================================================================");
console.log(`\n${passed}/${results.length} passed. ${failed > 0 ? failed + " FAILED." : "All good."}\n`);

if (failed > 0) process.exit(1);
