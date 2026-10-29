import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log(`Running M1 Verification Suite against ${BASE_URL}...`);

  // 1. Valid PDF Extraction (kit/SpecForge_Primer_Cards.pdf)
  try {
    const pdfBuf = fs.readFileSync(path.join(ROOT, "kit/SpecForge_Primer_Cards.pdf"));
    const form = new FormData();
    form.append("spec", new Blob([pdfBuf], { type: "application/pdf" }), "test_spec.pdf");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const text = json?.data?.spec?.text ?? "";
    const hasPrimerText = text.includes("SpecForge: Primer Cards");
    const ok = res.status === 200 && json?.success === true && hasPrimerText;

    results.push({
      name: "PDF extraction against valid fixture",
      passed: ok,
      details: ok
        ? `Status ${res.status}, characters extracted: ${text.length}, verified text snippet present.`
        : `Status ${res.status}, response: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "PDF extraction against valid fixture", passed: false, details: (e as Error).message });
  }

  // 2. Malformed PDF handling
  try {
    const corruptBuf = Buffer.from("%PDF-1.4 corrupt content that is not valid pdf EOF");
    const form = new FormData();
    form.append("spec", new Blob([corruptBuf], { type: "application/pdf" }), "corrupt.pdf");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const ok =
      res.status === 400 &&
      json?.success === false &&
      json?.error?.code === "EXTRACTION_FAILED";

    results.push({
      name: "Malformed PDF handling",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `Expected 400 EXTRACTION_FAILED, got HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Malformed PDF handling", passed: false, details: (e as Error).message });
  }

  // 3. Existing DOCX extraction
  try {
    const docxBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"));
    const form = new FormData();
    form.append("spec", new Blob([docxBuf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), "sample_course_spec.docx");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const text = json?.data?.spec?.text ?? "";
    const ok = res.status === 200 && json?.success === true && text.length > 0;

    results.push({
      name: "Existing DOCX extraction",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, extracted ${text.length} chars, snippet: "${text.slice(0, 50).replace(/\n/g, " ")}..."`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Existing DOCX extraction", passed: false, details: (e as Error).message });
  }

  // 3b. Binary DOC extraction (sample_blueprint.doc)
  try {
    const docBuf = fs.readFileSync(path.join(ROOT, "sample-inputs/sample_blueprint.doc"));
    const form = new FormData();
    form.append("spec", new Blob([fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"))]), "spec.docx");
    form.append("blueprint", new Blob([docBuf], { type: "application/msword" }), "sample_blueprint.doc");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const text = json?.data?.blueprint?.text ?? "";
    const ok = res.status === 200 && json?.success === true && text.includes("QUESTION PAPER BLUEPRINT");

    results.push({
      name: "Binary DOC extraction (.doc)",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, extracted ${text.length} chars from blueprint, verified header text present.`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Binary DOC extraction (.doc)", passed: false, details: (e as Error).message });
  }

  // 4. Existing HTML extraction
  try {
    const htmlBuf = Buffer.from("<!DOCTYPE html><html><head><title>Course</title></head><body><h1>Course Specification</h1><p>Course Outcomes: CO1 analyze algorithms.</p><script>alert('bad');</script></body></html>");
    const form = new FormData();
    form.append("spec", new Blob([htmlBuf], { type: "text/html" }), "syllabus.html");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const text = json?.data?.spec?.text ?? "";
    const strippedScript = !text.includes("alert");
    const hasContent = text.includes("Course Outcomes: CO1");
    const ok = res.status === 200 && json?.success === true && strippedScript && hasContent;

    results.push({
      name: "Existing HTML extraction",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, extracted text cleanly (scripts stripped): "${text.replace(/\n/g, " ").slice(0, 60)}..."`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Existing HTML extraction", passed: false, details: (e as Error).message });
  }

  // 5. Missing spec
  try {
    const form = new FormData();
    form.append("blueprint", new Blob(["test"], { type: "text/plain" }), "blueprint.txt");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const ok = res.status === 400 && json?.success === false && json?.error?.code === "MISSING_SPEC";
    results.push({
      name: "Missing spec",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Missing spec", passed: false, details: (e as Error).message });
  }

  // 6. Unsupported extension
  try {
    const form = new FormData();
    form.append("spec", new Blob(["course notes"], { type: "text/plain" }), "notes.txt");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const ok = res.status === 400 && json?.success === false && json?.error?.code === "UNSUPPORTED_FILE_TYPE";
    results.push({
      name: "Unsupported extension (.txt)",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Unsupported extension", passed: false, details: (e as Error).message });
  }

  // 7. Empty file
  try {
    const form = new FormData();
    form.append("spec", new Blob([new Uint8Array(0)], { type: "application/pdf" }), "empty.pdf");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const ok = res.status === 400 && json?.success === false && json?.error?.code === "EMPTY_FILE";
    results.push({
      name: "Empty file",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Empty file", passed: false, details: (e as Error).message });
  }

  // 8. Oversized file (>15MB)
  try {
    const oversizedBuf = new Uint8Array(16 * 1024 * 1024);
    const form = new FormData();
    form.append("spec", new Blob([oversizedBuf], { type: "application/pdf" }), "oversized.pdf");

    const res = await fetch(`${BASE_URL}/parse`, { method: "POST", body: form });
    const json = await res.json() as any;

    const ok = res.status === 413 && json?.success === false && json?.error?.code === "FILE_TOO_LARGE";
    results.push({
      name: "Oversized file (>15MB)",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `HTTP ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Oversized file", passed: false, details: (e as Error).message });
  }

  // Report Summary
  console.log("\n=================== VERIFICATION RESULTS ===================");
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`${icon} ${r.name}`);
    console.log(`       ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log("============================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
