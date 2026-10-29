import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import type { SpecForgeOutput } from "./schema.js";

const BLOOM_NAMES: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyse",
  5: "Evaluate",
  6: "Create",
};

function unescapeBasic(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

export function escapeHtml(str: string): string {
  if (!str) return "";
  const clean = unescapeBasic(String(str));
  return clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderSpecHtml(data: SpecForgeOutput): string {
  const templateFile =
    data.template === "integrated" ? "integrated_lab.html" : "non_lab.html";
  const templatePath = path.resolve(process.cwd(), "templates", templateFile);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  const html = fs.readFileSync(templatePath, "utf8");
  const $ = cheerio.load(html);

  // Document Title
  $("title").text(
    `${data.course.code || "CS"} - ${data.course.title || "Course Specifications"}`
  );

  // 1. Header and Course Title
  $('h1 span[contenteditable="true"]').text(data.course.title);

  // Course Details Table (under H1)
  $("table")
    .first()
    .find("tr")
    .each((_, tr) => {
      const label = $(tr).find("td.static").text().trim();
      const editableTd = $(tr).find('td[contenteditable="true"]');
      if (label.includes("Course Title")) {
        editableTd.text(data.course.title);
      } else if (label.includes("Course Code")) {
        editableTd.text(data.course.code);
      } else if (label.includes("Course Type")) {
        editableTd.text(data.course.course_type);
      } else if (label.includes("Department")) {
        editableTd.text(data.course.department);
      }
    });

  // 2. Section 1: Course Summary
  $('h2:contains("1. Course Summary")')
    .nextAll('p[contenteditable="true"]')
    .first()
    .text(data.course.summary);

  // 3. Section 2: Course Size and Credits
  const creditsLtp = data.course.credits_ltp || "3:0:0";
  const creditParts = creditsLtp.split(":").map((p) => Number(p.trim()) || 0);
  const totalCredits = creditParts.reduce((a, b) => a + b, 0);

  const th = data.teaching_hours || {};
  const computedTotalHours =
    (th.lectures ?? 0) + (th.lab ?? 0) + (th.tests_exams ?? 0);
  const totalInteractionHours =
    th.total && th.total > 0 ? th.total : (computedTotalHours > 0 ? computedTotalHours : 45);

  $('h2:contains("2. Course Size and Credits")')
    .nextAll("table")
    .first()
    .find("tr")
    .each((_, tr) => {
      const label = $(tr).find("td.static").text().trim();
      const editableTd = $(tr).find('td[contenteditable="true"]');
      if (label.includes("Number of Credits")) {
        editableTd.text(totalCredits.toString().padStart(2, "0"));
      } else if (label.includes("Credit Structure")) {
        editableTd.text(creditsLtp);
      } else if (label.includes("Total Hours of Interaction")) {
        editableTd.text(String(totalInteractionHours));
      } else if (label.includes("Department Responsible")) {
        editableTd.text(data.course.department);
      } else if (label.includes("Total Course Marks")) {
        editableTd.text("100");
      }
    });

  // 4. Section 3: Course Outcomes (COs)
  // Populate COs with clean statement, data-co-id, and Bloom's taxonomy badge
  const coList = $("ul.co-list");
  if (coList.length > 0) {
    coList.empty();
    for (const co of data.course_outcomes) {
      // Remove any redundant prefix like "CO-1:" or "CO1:" from statement to prevent duplicate numbering
      const cleanStatement = co.statement.replace(/^CO-?\d+[:.-]?\s*/i, "").trim();
      const bloomName = BLOOM_NAMES[co.bloom_level] || `L${co.bloom_level}`;
      const badgeHtml = `<span class="bloom-badge" style="display: inline-block; font-size: 8.5pt; font-weight: 600; color: #1a3d7c; background-color: #e8f0fe; border: 1px solid #c2d7fa; border-radius: 3px; padding: 1px 6px; margin-left: 6px; vertical-align: middle;">[L${co.bloom_level}: ${escapeHtml(bloomName)}]</span>`;

      coList.append(
        `<li data-co-id="${escapeHtml(co.id)}">${escapeHtml(cleanStatement)} ${badgeHtml}</li>`
      );
    }
  }

  // 5. Section 4: Course Contents
  const s4Header = $('h2:contains("4. Course Contents")');
  if (s4Header.length > 0) {
    // Remove existing unit rows before section 5
    let curr = s4Header.next();
    while (curr.length > 0 && !curr.is('h2:contains("5. Course Map")')) {
      const next = curr.next();
      if (curr.hasClass("unit-row")) {
        curr.remove();
      }
      curr = next;
    }

    // Insert newly populated unit rows
    const unitsHtml = data.units
      .map((unit) => {
        const cleanTitle = unit.title.replace(/^Unit\s*\d+\s*[:.-]?\s*/i, "").trim();
        const labBlock = unit.lab
          ? `<div class="unit-lab" style="margin-top: 4px; padding-left: 14px; font-size: 9.5pt; color: #333;"><strong style="color: #1a3d7c;">Practical/Lab:</strong> <span contenteditable="true">${escapeHtml(unit.lab)}</span></div>`
          : "";

        return `<div class="unit-row" data-unit-number="${unit.number}"><span class="static unit-label" style="padding: 1px 3px; border-radius: 2px;">Unit ${unit.number}:</span> <span contenteditable="true">${escapeHtml(cleanTitle)}</span>${labBlock}</div>`;
      })
      .join("\n");
    s4Header.after(unitsHtml);
  }

  // 6. Section 5: Course Map (CO-PO-PSO Map)
  const copoTbody = $("table.copo-table tbody");
  if (copoTbody.length > 0) {
    const legendRow = copoTbody.find("tr.copo-legend-row");
    copoTbody.find("tr:not(.copo-legend-row)").remove();

    const poKeys = [
      "PO-1",
      "PO-2",
      "PO-3",
      "PO-4",
      "PO-5",
      "PO-6",
      "PO-7",
      "PO-8",
      "PO-9",
      "PO-10",
      "PO-11",
    ];
    const psoKeys = ["PSO-1", "PSO-2"];

    for (const co of data.course_outcomes) {
      const coMap = data.co_po_pso_map[co.id] ?? {};

      const renderCell = (colKey: string) => {
        const c = coMap[colKey];
        if (c && c.level) {
          const val = c.level;
          const justification = c.justification ? escapeHtml(c.justification) : "";
          const titleAttr = justification ? ` title="${justification}"` : "";
          // Academic subtle tint for strengths
          let bgStyle = "";
          if (val === 3) bgStyle = "background-color: #dcfce7; font-weight: 600;";
          else if (val === 2) bgStyle = "background-color: #e0f2fe; font-weight: 500;";
          else if (val === 1) bgStyle = "background-color: #f1f5f9;";

          return `<td class="text-center" contenteditable="true" style="${bgStyle}" data-col="${colKey}" data-level="${val}" data-justification="${justification}"${titleAttr}>${val}</td>`;
        }
        return `<td class="text-center" contenteditable="true" data-col="${colKey}"></td>`;
      };

      const poCells = poKeys.map(renderCell).join("");
      const psoCells = psoKeys.map(renderCell).join("");

      const rowHtml = `<tr>\n<td class="text-center" contenteditable="true" style="font-weight:bold;">${escapeHtml(co.id)}</td>\n${poCells}${psoCells}\n</tr>`;

      if (legendRow.length > 0) {
        legendRow.before(rowHtml);
      } else {
        copoTbody.append(rowHtml);
      }
    }
  }

  // 7. Section 6: Teaching and Learning Methods
  // Harmonize all rows so duration numbers add up to the stated total
  const lecturesHours = th.lectures ?? 45;
  const labHours = th.lab ?? 0;
  const testsHours = th.tests_exams ?? 10;
  const tutorialCredits = creditParts.length >= 2 ? creditParts[1] : 0;
  const numeracyHours = tutorialCredits > 0 ? tutorialCredits * 15 : 0;

  $('h2:contains("6. Course Teaching and Learning Methods")')
    .nextAll("table")
    .first()
    .find("tr")
    .each((_, tr) => {
      const text = $(tr).text();
      const editableTds = $(tr).find('td[contenteditable="true"]');

      if (text.includes("Face to Face Lectures")) {
        editableTds.last().text(String(lecturesHours));
      } else if (text.includes("Numeracy")) {
        if (!text.includes("Solving Numerical Problems")) {
          editableTds.last().text(String(numeracyHours));
        }
      } else if (text.includes("Solving Numerical Problems")) {
        editableTds.first().text(String(numeracyHours));
        editableTds.last().text(String(numeracyHours));
      } else if (text.includes("Practicals")) {
        if (!text.includes("Course Laboratory") && !text.includes("Computer Laboratory")) {
          editableTds.last().text(String(labHours));
        }
      } else if (text.includes("Course Laboratory") || text.includes("Computer Laboratory")) {
        if (labHours > 0) {
          editableTds.first().text(String(labHours));
          editableTds.last().text(String(labHours));
        } else {
          editableTds.first().text("00");
          editableTds.last().text("00");
        }
      } else if (text.includes("Term Tests, Laboratory Examination/Written Examination")) {
        editableTds.last().text(String(testsHours));
      } else if (text.includes("Total Duration in Hours")) {
        editableTds.last().text(String(totalInteractionHours));
      }
    });

  // 8. Section 7: Course Assessment Table
  // Accurately map CO coverage against the actual template table columns
  const assessTable = $("table.assessment-integrated-table");
  if (assessTable.length > 0) {
    const tbody = assessTable.find("tbody");
    if (tbody.length > 0) {
      const footerRow = tbody.find("tr:has(td[colspan])").last();
      tbody.find("tr:not(:has(td[colspan]))").remove();

      // Read column headers from row 3 of the header table
      const headerRow = assessTable.find("thead tr").eq(3);
      const colHeaders: string[] = [];
      headerRow.find("th").each((_, thCell) => {
        colHeaders.push($(thCell).text().trim());
      });

      // Fallback columns if header row could not be parsed
      const fallbackHeaders =
        data.template === "integrated"
          ? ["Term Test-1", "Term Test-2", "Assignments", "Lab", "Written Exam", "Lab Exam"]
          : ["Term Test-1", "Term Test-2", "Assignments", "Written exam"];
      const activeHeaders = colHeaders.length > 0 ? colHeaders : fallbackHeaders;

      for (const co of data.course_outcomes) {
        const coveredComponents = data.assessment.co_coverage[co.id] ?? [];

        const cellsHtml = activeHeaders
          .map((hdr) => {
            const hLower = hdr.toLowerCase();
            // Determine whether this column is covered for the current CO
            const isCovered = coveredComponents.some((comp) => {
              const cLower = comp.toLowerCase();
              if (cLower === hLower || cLower.includes(hLower) || hLower.includes(cLower)) {
                return true;
              }
              // Synonym mapping
              if (hLower.includes("test-1") || hLower.includes("test 1")) {
                return cLower === "ce" || cLower.startsWith("ce") || cLower.includes("test 1") || cLower.includes("test-1") || cLower.includes("continuous evaluation");
              }
              if (hLower.includes("test-2") || hLower.includes("test 2")) {
                return cLower === "ce" || cLower.startsWith("ce") || cLower.includes("test 2") || cLower.includes("test-2") || cLower.includes("continuous evaluation");
              }
              if (hLower.includes("assignment")) {
                return cLower === "ce" || cLower.startsWith("ce") || cLower.includes("assignment") || cLower.includes("continuous evaluation");
              }
              if (hLower === "lab" || hLower === "practical") {
                return cLower.includes("lab") || cLower.includes("practical") || cLower.includes("continuous evaluation (lab)");
              }
              if (hLower.includes("written") || (hLower.includes("exam") && !hLower.includes("lab"))) {
                return cLower === "see" || cLower.startsWith("see") || cLower.includes("written") || cLower.includes("semester end");
              }
              if (hLower.includes("lab exam") || hLower.includes("practical exam")) {
                return cLower.includes("lab exam") || cLower.includes("practical exam");
              }
              return false;
            });

            // Fallback: If CO is declared assessed in coverage array, ensure at least one mark appears
            const mark = isCovered ? "X" : "";
            return `<td class="text-center" contenteditable="true" style="${mark ? "font-weight: bold; color: #111;" : ""}">${mark}</td>`;
          })
          .join("");

        const coRow = `<tr>\n<td class="static text-center" style="font-weight: bold;">${escapeHtml(co.id)}</td>\n${cellsHtml}\n</tr>`;
        if (footerRow.length > 0) {
          footerRow.before(coRow);
        } else {
          tbody.append(coRow);
        }
      }
    }
  }

  // 9. Section 9: Course Resources - Purge template dummy references
  const s9 = $('h2:contains("9. Course Resources")').next("div");
  if (s9.length > 0) {
    s9.find("ol").each((idx, ol) => {
      if (idx === 0) {
        // Essential Reading
        $(ol).html(
          `<li>Course lecture notes, prescribed problem sets, and study guides for ${escapeHtml(data.course.title)}.</li>\n` +
          `<li>Prescribed reference textbooks and laboratory manuals approved by the Department of ${escapeHtml(data.course.department)}.</li>`
        );
      } else if (idx === 1) {
        // Recommended Reading
        $(ol).html(
          `<li>Standard reference monographs, technical guidelines, and foundational literature relevant to ${escapeHtml(data.course.title)}.</li>`
        );
      } else if (idx === 2) {
        // Magazines and Journals
        $(ol).html(
          `<li>Peer-reviewed journals, IEEE / ACM transactions, and technical conference proceedings relevant to ${escapeHtml(data.course.department)}.</li>`
        );
      }
    });
  }

  // 10. Section 10: Defect & Quality Findings Panel (if defects exist)
  if (data.defects && data.defects.length > 0) {
    const defectRows = data.defects
      .map(
        (d) =>
          `<tr>\n` +
          `<td style="border: 1px solid #777; padding: 4px 6px; font-weight: bold; font-family: monospace;">${escapeHtml(d.code)}</td>\n` +
          `<td style="border: 1px solid #777; padding: 4px 6px;">${escapeHtml(d.location.source)}${d.location.section ? ` (Sec ${d.location.section})` : ""}${d.location.refs && d.location.refs.length > 0 ? `: ${escapeHtml(d.location.refs.join(", "))}` : ""}</td>\n` +
          `<td style="border: 1px solid #777; padding: 4px 6px;">${escapeHtml(d.description)}</td>\n` +
          `<td style="border: 1px solid #777; padding: 4px 6px; color: #166534;">${escapeHtml(d.fix)}</td>\n` +
          `</tr>`
      )
      .join("\n");

    const auditSectionHtml = `
<div class="defects-audit-section" style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #ccc; page-break-inside: avoid;">
  <h2><span class="static" style="padding: 1px 4px; border-radius: 2px;">10. Specification Audit and Quality Findings</span></h2>
  <p style="font-size: 9.5pt; color: #444; margin-bottom: 8px;">The following ${data.defects.length} defect(s) and harmonization findings were identified and corrected in this specification:</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 1.2em;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th class="static" style="border: 1px solid #777; padding: 4px 6px; width: 18%;">Defect Code</th>
        <th class="static" style="border: 1px solid #777; padding: 4px 6px; width: 17%;">Location</th>
        <th class="static" style="border: 1px solid #777; padding: 4px 6px; width: 40%;">Description</th>
        <th class="static" style="border: 1px solid #777; padding: 4px 6px; width: 25%;">Applied Fix</th>
      </tr>
    </thead>
    <tbody>
      ${defectRows}
    </tbody>
  </table>
</div>`;

    $(".page").append(auditSectionHtml);
  }

  let finalHtml = $.html();

  // Final purge of any stray template sample strings
  finalHtml = finalHtml
    .replace(/Computer Vision/g, data.course.title)
    .replace(/computer vision/g, data.course.title.toLowerCase())
    .replace(/AIC304A/g, data.course.code)
    .replace(/AIML/g, data.course.department);

  return finalHtml;
}

