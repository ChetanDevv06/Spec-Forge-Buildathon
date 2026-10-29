import assert from "node:assert/strict";
import fs from "node:fs";
import { extractFile } from "../server/extract.js";
import {
  postValidateAndFix,
  sourceAssessmentComponents,
  sourceAssessmentCoverage,
  sourceCourseMap,
} from "../server/pipeline.js";
import { SpecForgeOutputSchema } from "../server/schema.js";

const validPsos = new Set(["PSO-1", "PSO-2"]);

async function sampleSpecText() {
  return extractFile({
    originalname: "sample_course_spec.docx",
    buffer: fs.readFileSync("sample-inputs/sample_course_spec.docx"),
  } as Express.Multer.File);
}

async function main() {
  const sample = await sampleSpecText();
  assert.match(sample.text, /PO-1 \| PO-2 \| PO-3/);
  assert.match(sample.text, /Course Outcome \| CE \(Weightage: 60 %\)/);

  const map = sourceCourseMap(sample.text, validPsos);
  assert.equal(Object.keys(map).length, 4, "the sample map has four source rows");
  assert.equal(map["CO-1"]?.["PO-1"]?.level, 1);
  assert.equal(map["CO-2"]?.["PO-3"]?.level, 3);
  assert.equal(map["CO-4"]?.["PO-10"]?.level, 1);
  assert.equal(map["CO-1"]?.["PSO-3"], undefined, "unsupported PSO is excluded");
  assert.equal(map["CO-5"], undefined, "missing source row is not manufactured");

  const components = sourceAssessmentComponents(sample.text);
  assert.deepEqual(components, [
    { name: "CE", weight_percent: 60 },
    { name: "SEE", weight_percent: 25 },
    { name: "Lab", weight_percent: 15 },
  ]);
  const coverage = sourceAssessmentCoverage(sample.text, components.map((component) => component.name));
  assert.deepEqual(coverage["CO-1"], ["CE", "SEE"]);
  assert.deepEqual(coverage["CO-6"], ["CE", "Lab"], "Lab CE remains CE while LSEE remains Lab");

  const mergedHeaders = [
    "Programme Outcomes | Programme Specific Outcomes",
    "PO 1 | PSO 1 | PSO 3",
    "CO-1 | 2 | 3 | 1",
  ].join("\n");
  const mergedMap = sourceCourseMap(mergedHeaders, validPsos);
  assert.equal(mergedMap["CO-1"]?.["PO-1"]?.level, 2);
  assert.equal(mergedMap["CO-1"]?.["PSO-1"]?.level, 3);
  assert.equal(mergedMap["CO-1"]?.["PSO-3"], undefined);

  const malformedMap = [
    "PO-1 | PSO-1",
    "CO-1 | 1 | 2",
    "CO-2 | 3",
  ].join("\n");
  assert.deepEqual(sourceCourseMap(malformedMap, validPsos), {}, "malformed rows do not overwrite a model map");

  const malformedAssessment = [
    "Course Outcome | CE (Weightage: 60 %) | SEE (Weightage: 40 %)",
    "Tests | Written exam",
    "CO-1 | X",
  ].join("\n");
  assert.deepEqual(sourceAssessmentCoverage(malformedAssessment, ["CE", "SEE"]), {});

  const narrativeOnly = SpecForgeOutputSchema.parse({
    schema_version: "1.0",
    input_id: "SAMPLE",
    template: "non_lab",
    course: { title: "Test", code: "T-1", department: "Test", credits_ltp: "3:0:0", course_type: "Theory", summary: "A concise test summary." },
    course_outcomes: [{ id: "CO-1", statement: "Explain a documented concept.", bloom_level: 2 }],
    units: [],
    co_po_pso_map: { "CO-1": { "PO-1": { level: 1, justification: "Source mapping." } } },
    teaching_hours: { lectures: 1, lab: 0, tests_exams: 0, total: 1 },
    assessment: { components: [{ name: "CE", weight_percent: 100 }], co_coverage: { "CO-1": ["CE"] } },
    defects: [],
  });
  const withNarrative = postValidateAndFix(
    narrativeOnly,
    "PO-1 | PSO-1\nCO-1 | 1 | 1\nNarrative text may mention CO-99 without placing it in a table."
  );
  assert.equal(withNarrative.defects.some((defect) => defect.location.refs?.includes("CO-99")), false);

  console.log("Pipeline parsing regression tests passed.");
}

void main();
