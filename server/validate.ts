/**
 * server/validate.ts
 * M4 — Deterministic V1–V10 validation.
 *
 * runDeterministicValidation(output, html?) returns an array of NEW Defect
 * objects that should be appended to output.defects.  It never mutates academic
 * facts (CO text, mapping strengths, etc.).  Callers decide whether blocking
 * defects should abort the pipeline.
 */

import fs from "node:fs";
import path from "node:path";
import type { SpecForgeOutput, Defect } from "./schema.js";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function loadPsoIds(): string[] {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "config/po_pso.json"), "utf8")
    );
    return ((cfg.psos ?? []) as Array<{ id: string }>).map((p) => p.id);
  } catch {
    return ["PSO-1", "PSO-2"]; // safe fallback
  }
}

function defect(
  code: Defect["code"],
  source: Defect["location"]["source"],
  section: number | null,
  refs: string[],
  description: string,
  fix: string
): Defect {
  return { code, location: { source, section, refs }, description, fix };
}

// ──────────────────────────────────────────────────────────────────────────────
// V1 — CO count consistency across Sections 3, 5 and 7
// ──────────────────────────────────────────────────────────────────────────────

export function v1CoCountConsistency(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const coIds = output.course_outcomes.map((c) => c.id);
  const mapIds = Object.keys(output.co_po_pso_map);
  const covIds = Object.keys(output.assessment.co_coverage);
  const missingMapIds = coIds.filter((id) => !mapIds.includes(id));
  const missingCoverageIds = coIds.filter((id) => !covIds.includes(id));

  if (mapIds.length !== coIds.length) {
    issues.push(
      defect(
        "CO_MISSING_IN_TABLE",
        "spec",
        5,
        missingMapIds,
        `Section 3 defines ${coIds.length} CO(s) [${coIds.join(", ")}] but Section 5 map has ${mapIds.length} row(s) [${mapIds.join(", ")}].`,
        "Ensure co_po_pso_map has exactly one row per defined CO."
      )
    );
  }
  if (covIds.length !== coIds.length) {
    issues.push(
      defect(
        "CO_ASSESSMENT_MISMATCH",
        "spec",
        7,
        missingCoverageIds,
        `Section 3 defines ${coIds.length} CO(s) [${coIds.join(", ")}] but Section 7 coverage has ${covIds.length} entr(ies) [${covIds.join(", ")}].`,
        "Ensure assessment.co_coverage contains an entry for every defined CO."
      )
    );
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V2 — Every CO must map to at least one PO
// ──────────────────────────────────────────────────────────────────────────────

export function v2EveryCoMapsOnePo(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const PO_PATTERN = /^PO-/;

  for (const co of output.course_outcomes) {
    const row = output.co_po_pso_map[co.id] ?? {};
    const hasPo = Object.entries(row).some(
      ([key, val]) => PO_PATTERN.test(key) && val != null
    );
    if (!hasPo) {
      issues.push(
        defect(
          "CO_MISSING_IN_TABLE",
          "spec",
          5,
          [co.id],
          `${co.id} has no PO mapping in Section 5. Every CO must map to at least one Programme Outcome.`,
          `Add at least one PO mapping for ${co.id}.`
        )
      );
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V3 — Every CO must be assessed
// ──────────────────────────────────────────────────────────────────────────────

export function v3EveryCoAssessed(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  for (const co of output.course_outcomes) {
    const components = output.assessment.co_coverage[co.id];
    if (!components || components.length === 0) {
      issues.push(
        defect(
          "CO_ASSESSMENT_MISMATCH",
          "spec",
          7,
          [co.id],
          `${co.id} is not covered by any assessment component in Section 7.`,
          `Map ${co.id} to at least one assessment component.`
        )
      );
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V4 — No table should reference an undefined CO
// ──────────────────────────────────────────────────────────────────────────────

export function v4NoOrphanedCoRefs(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const definedCoIds = new Set(output.course_outcomes.map((c) => c.id));

  for (const mapCoId of Object.keys(output.co_po_pso_map)) {
    if (!definedCoIds.has(mapCoId)) {
      issues.push(
        defect(
          "CO_EXTRA_IN_TABLE",
          "spec",
          5,
          [mapCoId],
          `${mapCoId} appears in Section 5 CO-PO map but is not defined in Section 3 Course Outcomes.`,
          `Remove ${mapCoId} from co_po_pso_map or add it to course_outcomes.`
        )
      );
    }
  }

  for (const covCoId of Object.keys(output.assessment.co_coverage)) {
    if (!definedCoIds.has(covCoId)) {
      issues.push(
        defect(
          "CO_EXTRA_IN_TABLE",
          "spec",
          7,
          [covCoId],
          `${covCoId} appears in Section 7 assessment coverage but is not defined in Section 3 Course Outcomes.`,
          `Remove ${covCoId} from assessment.co_coverage or add it to course_outcomes.`
        )
      );
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V5 — Teaching hours must add up correctly
// ──────────────────────────────────────────────────────────────────────────────

export function v5TeachingHoursSum(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const th = output.teaching_hours;
  const lectures = th.lectures ?? 0;
  const lab = th.lab ?? 0;
  const tests = th.tests_exams ?? 0;
  const total = th.total ?? 0;

  const computedSum = lectures + lab + tests;
  if (total > 0 && computedSum > 0 && computedSum !== total) {
    issues.push(
      defect(
        "HOURS_INCONSISTENT",
        "spec",
        6,
        [],
        `Teaching hours: lectures(${lectures}) + lab(${lab}) + tests_exams(${tests}) = ${computedSum}, but total is declared as ${total}.`,
        `Correct total to ${computedSum} or adjust individual hour components to sum to ${total}.`
      )
    );
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V6 — Assessment weightages must total 100%
// ──────────────────────────────────────────────────────────────────────────────

export function v6AssessmentWeightTotal(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const components = output.assessment.components;
  if (components.length === 0) return issues;

  const total = components.reduce((acc, c) => acc + (c.weight_percent || 0), 0);
  if (Math.abs(total - 100) > 0.01) {
    issues.push(
      defect(
        "WEIGHTAGE_INCONSISTENT",
        "spec",
        7,
        [],
        `Assessment weights sum to ${total}% [${components.map((c) => `${c.name}: ${c.weight_percent}%`).join(", ")}], expected 100%.`,
        "Adjust component weightages so they total exactly 100%."
      )
    );
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V7 — No unresolved template placeholders or leftover sample content in HTML
// ──────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\{\{[^}]+\}\}/g,
  /\[PLACEHOLDER[^\]]*\]/gi,
  /\[INSERT[^\]]*\]/gi,
  /\[TO BE[^\]]*\]/gi,
  /<<[^>]+>>/g,
  /\[COURSE NAME\]/gi,
  /\[DEPARTMENT\]/gi,
];

const KNOWN_SAMPLE_STRINGS = [
  "Computer Vision",
  "AIC304A",
  "AIML Department",
  "R.C. Gonzalez",
  "Szeliski",
  "Forsyth",
  "IEEE-T-PAMI",
  "IJCV",
];

export function v7NoUnresolvedPlaceholders(
  output: SpecForgeOutput,
  renderedHtml: string
): Defect[] {
  const issues: Defect[] = [];

  for (const pattern of PLACEHOLDER_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    const matches = renderedHtml.match(re);
    if (matches && matches.length > 0) {
      const unique = [...new Set(matches)].slice(0, 5);
      issues.push(
        defect(
          "PLACEHOLDER_TEXT",
          "template",
          null,
          unique,
          `Unresolved template placeholder(s) found in rendered HTML: ${unique.join(", ")}`,
          "Replace all placeholder markers with actual course content before export."
        )
      );
    }
  }

  for (const sample of KNOWN_SAMPLE_STRINGS) {
    if (renderedHtml.includes(sample)) {
      const isActualCourseData =
        output.course.title.includes(sample) ||
        output.course.code.includes(sample) ||
        output.course.department.includes(sample);
      if (!isActualCourseData) {
        issues.push(
          defect(
            "PLACEHOLDER_TEXT",
            "template",
            null,
            [sample],
            `Leftover template sample text "${sample}" found in rendered HTML; it does not match the actual course.`,
            `Remove or replace sample text "${sample}" with actual course content.`
          )
        );
      }
    }
  }

  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V8 — PSO columns must match authoritative config/po_pso.json
// ──────────────────────────────────────────────────────────────────────────────

export function v8PsoColumnsMatchConfig(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const authoritative = new Set(loadPsoIds());

  for (const [coId, row] of Object.entries(output.co_po_pso_map)) {
    for (const colKey of Object.keys(row)) {
      if (colKey.startsWith("PSO-") && !authoritative.has(colKey)) {
        issues.push(
          defect(
            "PSO_COLUMN_MISMATCH",
            "spec",
            5,
            [coId, colKey],
            `${colKey} in ${coId}'s mapping row is not a valid PSO in config/po_pso.json (valid: ${[...authoritative].join(", ")}).`,
            `Remove ${colKey} from ${coId}'s mapping or add it to config/po_pso.json.`
          )
        );
      }
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V9 — Mapping strengths 1/2/3; Bloom ceiling; PO-3/PO-5 practical evidence
// ──────────────────────────────────────────────────────────────────────────────

const PO_PRACTICAL_REQUIRED = new Set(["PO-3", "PO-5"]);

export function v9MappingStrengthsAndBlooms(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const bloomByCoId: Record<string, number> = {};
  for (const co of output.course_outcomes) {
    bloomByCoId[co.id] = co.bloom_level;
  }

  const labHours = output.teaching_hours.lab ?? 0;
  const hasPractical =
    labHours > 0 ||
    output.course.course_type.toLowerCase().includes("lab") ||
    output.course.course_type.toLowerCase().includes("integrated");

  for (const [coId, row] of Object.entries(output.co_po_pso_map)) {
    const bloom = bloomByCoId[coId] ?? 6;

    for (const [colKey, cell] of Object.entries(row)) {
      if (cell == null) continue;
      const strength = cell.level;

      if (![1, 2, 3].includes(strength)) {
        issues.push(
          defect(
            "MAPPING_UNSUPPORTED",
            "spec",
            5,
            [coId, colKey],
            `${coId}→${colKey} has strength ${strength}, which is not one of the valid values 1, 2, or 3.`,
            "Use only 1 (Moderate), 2 (Strong), or 3 (Very strong)."
          )
        );
        continue;
      }

      const bloomCeiling = Math.min(bloom, 3);
      if (strength > bloomCeiling) {
        issues.push(
          defect(
            "MAPPING_BLOOM_MISMATCH",
            "spec",
            5,
            [coId, colKey],
            `${coId} (Bloom L${bloom}) maps to ${colKey} at strength ${strength}, which exceeds the Bloom ceiling of ${bloomCeiling}.`,
            `Reduce the mapping strength to ≤${bloomCeiling} to match ${coId}'s Bloom level.`
          )
        );
      }

      if (PO_PRACTICAL_REQUIRED.has(colKey) && strength === 3 && !hasPractical) {
        issues.push(
          defect(
            "MAPPING_UNSUPPORTED",
            "spec",
            5,
            [coId, colKey],
            `${coId}→${colKey} at strength 3 claims strong design/tool usage, but the course has no lab hours or lab/integrated course type to provide practical evidence.`,
            `Reduce ${coId}→${colKey} to strength 1 or 2, or add laboratory components.`
          )
        );
      }
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// V10 — Template selection follows credits/course-type rule
// ──────────────────────────────────────────────────────────────────────────────

export function v10TemplateRule(output: SpecForgeOutput): Defect[] {
  const issues: Defect[] = [];
  const parts = output.course.credits_ltp
    .split(":")
    .map((p) => Number(p.trim()) || 0);
  const practicalCredits = parts.length >= 3 ? parts[2] : 0;
  const isLabType =
    output.course.course_type.toLowerCase().includes("lab") ||
    output.course.course_type.toLowerCase().includes("integrated");

  const expectedTemplate: "integrated" | "non_lab" =
    practicalCredits > 0 || isLabType ? "integrated" : "non_lab";

  if (output.template !== expectedTemplate) {
    const alreadyDocumented = output.defects.some(
      (d) => d.code === "WRONG_TEMPLATE"
    );
    if (!alreadyDocumented) {
      issues.push(
        defect(
          "WRONG_TEMPLATE",
          "template",
          null,
          [],
          `Template is "${output.template}" but credits_ltp "${output.course.credits_ltp}" and course_type "${output.course.course_type}" require "${expectedTemplate}".`,
          `Switch template to "${expectedTemplate}" or document the override reason in the defects array with code WRONG_TEMPLATE.`
        )
      );
    }
  }
  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public orchestrator
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Run all V1–V10 deterministic checks.
 * Returns only NEW defects not already present in output.defects.
 * Pass renderedHtml for V7; omit or pass "" to skip HTML checks.
 */
export function runDeterministicValidation(
  output: SpecForgeOutput,
  renderedHtml = ""
): Defect[] {
  const newDefects: Defect[] = [
    ...v1CoCountConsistency(output),
    ...v2EveryCoMapsOnePo(output),
    ...v3EveryCoAssessed(output),
    ...v4NoOrphanedCoRefs(output),
    ...v5TeachingHoursSum(output),
    ...v6AssessmentWeightTotal(output),
    ...(renderedHtml ? v7NoUnresolvedPlaceholders(output, renderedHtml) : []),
    ...v8PsoColumnsMatchConfig(output),
    ...v9MappingStrengthsAndBlooms(output),
    ...v10TemplateRule(output),
  ];

  // Deduplicate: skip if same code+refs combo already exists in output.defects
  const existingSignatures = new Set(
    output.defects.map(
      (d) => `${d.code}|${(d.location.refs ?? []).sort().join(",")}`
    )
  );
  return newDefects.filter((d) => {
    const sig = `${d.code}|${(d.location.refs ?? []).sort().join(",")}`;
    return !existingSignatures.has(sig);
  });
}
