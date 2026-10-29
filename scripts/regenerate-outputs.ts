import fs from "node:fs";
import { extractFile } from "../server/extract.js";
import { postValidateAndFix } from "../server/pipeline.js";
import { renderSpecHtml } from "../server/render.js";
import { SpecForgeOutputSchema } from "../server/schema.js";

async function extractSample(filename: string) {
  const buffer = fs.readFileSync(`sample-inputs/${filename}`);
  return extractFile({ originalname: filename, buffer } as Express.Multer.File);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync("outputs/specforge_output.json", "utf8"));
  const [spec, blueprint] = await Promise.all([
    extractSample("sample_course_spec.docx"),
    extractSample("sample_blueprint.doc"),
  ]);

  const normalized = postValidateAndFix(raw, spec.text, blueprint.text);
  const checked = SpecForgeOutputSchema.parse(normalized);
  fs.writeFileSync("outputs/specforge_output.json", JSON.stringify(checked, null, 2), "utf8");
  fs.writeFileSync("outputs/spec.html", renderSpecHtml(checked), "utf8");
  console.log("Normalized existing output using the source documents.");
}

void main();
