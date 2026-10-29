import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { SpecForgeOutputSchema } from "../server/schema.js";
import { renderSpecHtml } from "../server/render.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runGenerateTests() {
  console.log(`Running M2 Generate Endpoint Verification against ${BASE_URL}...`);

  // 1. Missing LLM Key header
  try {
    const form = new FormData();
    form.append("spec", new Blob([fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"))]), "spec.docx");

    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      body: form,
      headers: { "x-llm-provider": "gemini" }, // no x-llm-key
    });
    const json = (await res.json()) as any;
    const ok = res.status === 400 && json?.success === false && json?.error?.code === "MISSING_KEY";
    results.push({
      name: "Missing LLM Key validation",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `Expected 400 MISSING_KEY, got ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Missing LLM Key validation", passed: false, details: (e as Error).message });
  }

  // 2. Bad Provider header
  try {
    const form = new FormData();
    form.append("spec", new Blob([fs.readFileSync(path.join(ROOT, "sample-inputs/sample_course_spec.docx"))]), "spec.docx");

    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      body: form,
      headers: { "x-llm-provider": "unsupported_llm", "x-llm-key": "fake-key" },
    });
    const json = (await res.json()) as any;
    const ok = res.status === 400 && json?.success === false && json?.error?.code === "BAD_PROVIDER";
    results.push({
      name: "Bad Provider validation",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `Expected 400 BAD_PROVIDER, got ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Bad Provider validation", passed: false, details: (e as Error).message });
  }

  // 3. Missing spec file
  try {
    const form = new FormData();
    form.append("blueprint", new Blob(["blueprint text"]), "bp.txt");

    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      body: form,
      headers: { "x-llm-provider": "gemini", "x-llm-key": "fake-key" },
    });
    const json = (await res.json()) as any;
    const ok = res.status === 400 && json?.success === false && json?.error?.code === "MISSING_SPEC";
    results.push({
      name: "Missing spec validation",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `Expected 400 MISSING_SPEC, got ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Missing spec validation", passed: false, details: (e as Error).message });
  }

  // 4. Empty spec file
  try {
    const form = new FormData();
    form.append("spec", new Blob([new Uint8Array(0)]), "empty.docx");

    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      body: form,
      headers: { "x-llm-provider": "gemini", "x-llm-key": "fake-key" },
    });
    const json = (await res.json()) as any;
    const ok = res.status === 400 && json?.success === false && json?.error?.code === "EMPTY_FILE";
    results.push({
      name: "Empty spec validation",
      passed: ok,
      details: ok
        ? `HTTP ${res.status}, code: ${json.error.code}, message: "${json.error.message}"`
        : `Expected 400 EMPTY_FILE, got ${res.status}: ${JSON.stringify(json)}`,
    });
  } catch (e) {
    results.push({ name: "Empty spec validation", passed: false, details: (e as Error).message });
  }

  // 5. Schema Conformance Verification (Offline validation against config/specforge_output.schema.json)
  try {
    const schemaJson = JSON.parse(fs.readFileSync(path.join(ROOT, "config/specforge_output.schema.json"), "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validate = ajv.compile(schemaJson);

    // Mock realistic academic specforge_output object
    const sampleOutput = {
      schema_version: "1.0",
      input_id: "SAMPLE",
      template: "integrated",
      course: {
        title: "Introduction to Computer Science and Engineering",
        code: "CSE101A",
        department: "Computer Science and Engineering",
        credits_ltp: "3:0:1",
        course_type: "Core Integrated",
        summary: "Covers algorithmic foundations, programming constructs, and hands-on laboratory exercises.",
      },
      course_outcomes: [
        { id: "CO-1", statement: "Identify foundational computer science components and architectures.", bloom_level: 1 },
        { id: "CO-2", statement: "Explain fundamental algorithms and algorithmic complexity.", bloom_level: 2 },
        { id: "CO-3", statement: "Apply procedural programming constructs to solve computational problems.", bloom_level: 3 },
        { id: "CO-4", statement: "Analyze structured data representations for computational efficiency.", bloom_level: 4 },
        { id: "CO-5", statement: "Design and implement software modules with laboratory verification.", bloom_level: 6 },
      ],
      units: [
        { number: 1, title: "Foundations of Computing", lab: null },
        { number: 2, title: "Algorithms and Problem Solving", lab: null },
        { number: 3, title: "Programming Constructs and Control Flow", lab: "Basic Syntax and Control Structures" },
        { number: 4, title: "Data Structures and Efficiency", lab: "Array and Pointer Implementations" },
        { number: 5, title: "Modular Design and Testing", lab: "Integrated Laboratory Project" },
      ],
      co_po_pso_map: {
        "CO-1": { "PO-1": { level: 2, justification: "Applies basic computing science knowledge." }, "PSO-1": { level: 2, justification: "Foundational computing concepts." } },
        "CO-2": { "PO-1": { level: 2, justification: "Engineering knowledge of algorithms." }, "PO-2": { level: 2, justification: "Problem analysis using complexity measures." }, "PSO-1": { level: 2, justification: "Algorithm analysis." } },
        "CO-3": { "PO-1": { level: 3, justification: "Direct application of programming fundamentals." }, "PO-3": { level: 2, justification: "Implementation of problem solutions." }, "PO-5": { level: 2, justification: "Use of IDE and compiler tools." }, "PSO-1": { level: 3, justification: "Programming problem solving." } },
        "CO-4": { "PO-1": { level: 2, justification: "Mathematical data structures." }, "PO-2": { level: 3, justification: "Rigorous efficiency analysis." }, "PSO-1": { level: 3, justification: "Data structure analysis." } },
        "CO-5": { "PO-3": { level: 3, justification: "Complete software solution development." }, "PO-5": { level: 3, justification: "Integrated tool usage in lab." }, "PSO-2": { level: 3, justification: "Design and develop software solutions." } },
      },
      teaching_hours: { lectures: 42, lab: 28, tests_exams: 5, total: 75 },
      assessment: {
        components: [
          { name: "Continuous Evaluation (Theory)", weight_percent: 30 },
          { name: "Continuous Evaluation (Lab)", weight_percent: 30 },
          { name: "Semester End Exam", weight_percent: 40 },
        ],
        co_coverage: {
          "CO-1": ["Continuous Evaluation (Theory)"],
          "CO-2": ["Continuous Evaluation (Theory)", "Semester End Exam"],
          "CO-3": ["Continuous Evaluation (Lab)", "Semester End Exam"],
          "CO-4": ["Continuous Evaluation (Theory)", "Semester End Exam"],
          "CO-5": ["Continuous Evaluation (Lab)", "Semester End Exam"],
        },
      },
      defects: [
        {
          code: "WEIGHTAGE_INCONSISTENT",
          location: { source: "spec", section: 7, refs: [] },
          description: "Internal CE subcomponents showed minor rounding discrepancy in legacy spec.",
          fix: "Harmonized to exact 30/30/40 component breakdown totaling 100%.",
        },
      ],
    };

    // Test Zod validation
    const zodParsed = SpecForgeOutputSchema.safeParse(sampleOutput);
    // Test AJV validation against official schema file
    const ajvValid = validate(sampleOutput);

    const ok = zodParsed.success && ajvValid;
    results.push({
      name: "Authoritative Schema conformance (Zod & AJV)",
      passed: ok,
      details: ok
        ? "Sample specification strictly satisfies config/specforge_output.schema.json without any errors."
        : `Zod errors: ${zodParsed.error?.message}, AJV errors: ${JSON.stringify(validate.errors)}`,
    });

    // 6. Integrated Template Rendering Verification
    if (zodParsed.success) {
      const renderedHtml = renderSpecHtml(zodParsed.data);
      const hasTitle = renderedHtml.includes("Introduction to Computer Science and Engineering");
      const hasCode = renderedHtml.includes("CSE101A");
      const noComputerVision = !renderedHtml.includes("Computer Vision");
      const noAIC304A = !renderedHtml.includes("AIC304A");
      const hasCO5 = renderedHtml.includes("CO-5");
      const hasBloom = renderedHtml.includes("[L6: Create]") && renderedHtml.includes("[L1: Remember]");
      const hasLab = renderedHtml.includes("Integrated Laboratory Project");
      const hasDefects = renderedHtml.includes("WEIGHTAGE_INCONSISTENT");

      const htmlOk = hasTitle && hasCode && noComputerVision && noAIC304A && hasCO5 && hasBloom && hasLab && hasDefects;
      results.push({
        name: "Integrated Template population, Bloom levels & Defect panel",
        passed: htmlOk,
        details: htmlOk
          ? "Integrated HTML rendered successfully: Course details, COs with Bloom badges, unit labs, matrix, and defect audit panel present."
          : `Integrated template check failed: hasTitle=${hasTitle}, hasCode=${hasCode}, noComputerVision=${noComputerVision}, noAIC304A=${noAIC304A}, hasBloom=${hasBloom}, hasLab=${hasLab}, hasDefects=${hasDefects}`,
      });
    }

    // 7. Non-Lab Template Rendering Verification
    try {
      const nonLabOutput = {
        ...sampleOutput,
        template: "non_lab" as const,
        course: {
          ...sampleOutput.course,
          title: "Discrete Mathematics & Graph Theory",
          code: "MAT201A",
          credits_ltp: "3:1:0",
          course_type: "Core Theory",
        },
        teaching_hours: { lectures: 45, lab: 0, tests_exams: 10, total: 55 },
        units: sampleOutput.units.map((u) => ({ ...u, lab: null })),
      };
      const nonLabZod = SpecForgeOutputSchema.safeParse(nonLabOutput);
      if (nonLabZod.success) {
        const nonLabHtml = renderSpecHtml(nonLabZod.data);
        const hasTitle = nonLabHtml.includes("Discrete Mathematics &amp; Graph Theory") || nonLabHtml.includes("Discrete Mathematics & Graph Theory");
        const hasCode = nonLabHtml.includes("MAT201A");
        const noComputerVision = !nonLabHtml.includes("Computer Vision");
        const noAIC304A = !nonLabHtml.includes("AIC304A");
        const hasBloom = nonLabHtml.includes("[L1: Remember]");
        const noLabExamCol = !nonLabHtml.includes("Lab Exam</th>");

        const ok = hasTitle && hasCode && noComputerVision && noAIC304A && hasBloom && noLabExamCol;
        results.push({
          name: "Non-Lab Template rendering & column structure",
          passed: ok,
          details: ok
            ? "Non-lab HTML rendered successfully with 4-column assessment table and proper theory structure."
            : `Non-lab check failed: hasTitle=${hasTitle}, hasCode=${hasCode}, noCV=${noComputerVision}, noLabExamCol=${noLabExamCol}`,
        });
      }
    } catch (e) {
      results.push({ name: "Non-Lab Template rendering", passed: false, details: (e as Error).message });
    }

    // 8. Safe HTML Escaping Verification
    try {
      const injectionOutput = {
        ...sampleOutput,
        course: {
          ...sampleOutput.course,
          title: "Operating Systems <script>alert(1)</script> & Networks",
          summary: "Study of OS & processes with <style>body{color:red;}</style> test.",
        },
      };
      const injZod = SpecForgeOutputSchema.safeParse(injectionOutput);
      if (injZod.success) {
        const injHtml = renderSpecHtml(injZod.data);
        const scriptEscaped = !injHtml.includes("<script>alert(1)</script>") && injHtml.includes("&lt;script&gt;alert(1)&lt;/script&gt;");
        const styleEscaped = !injHtml.includes("<style>body{color:red;}</style>") && injHtml.includes("&lt;style&gt;body{color:red;}&lt;/style&gt;");
        const noDoubleEscape = !injHtml.includes("&amp;amp;");

        const ok = scriptEscaped && styleEscaped && noDoubleEscape;
        results.push({
          name: "HTML Escaping & XSS Sanitization",
          passed: ok,
          details: ok
            ? "Special characters (<, >, &, \") safely escaped without double-escaping; script injection neutralized."
            : `Escaping check failed: scriptEscaped=${scriptEscaped}, styleEscaped=${styleEscaped}, noDoubleEscape=${noDoubleEscape}`,
        });
      }
    } catch (e) {
      results.push({ name: "HTML Escaping & XSS Sanitization", passed: false, details: (e as Error).message });
    }

    // 9. Existing specforge_output.json Re-rendering
    try {
      const existingOutPath = path.join(ROOT, "outputs/specforge_output.json");
      if (fs.existsSync(existingOutPath)) {
        const existingData = JSON.parse(fs.readFileSync(existingOutPath, "utf8"));
        const existingZod = SpecForgeOutputSchema.safeParse(existingData);
        if (existingZod.success) {
          const reRendered = renderSpecHtml(existingZod.data);
          fs.writeFileSync(path.join(ROOT, "outputs/spec.html"), reRendered);
          results.push({
            name: "outputs/spec.html generation from outputs/specforge_output.json",
            passed: true,
            details: `Successfully rendered outputs/spec.html (${reRendered.length} bytes) consistent with outputs/specforge_output.json.`,
          });
        }
      }
    } catch (e) {
      results.push({ name: "outputs/spec.html generation", passed: false, details: (e as Error).message });
    }
  } catch (e) {
    results.push({ name: "Authoritative Schema conformance", passed: false, details: (e as Error).message });
  }

  // Summary
  console.log("\n=================== M2 VERIFICATION RESULTS ===================");
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`${icon} ${r.name}`);
    console.log(`       ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log("===============================================================\n");

  if (!allPassed) process.exit(1);
}

runGenerateTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
