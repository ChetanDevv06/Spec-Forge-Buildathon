import path from "node:path";
import type { Express } from "express";
import mammoth from "mammoth";
// @ts-expect-error - pdf-parse/lib/pdf-parse.js bypasses index.js debug self-test
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import cheerio from "cheerio";
import WordExtractor from "word-extractor";
import { ApiError } from "./envelope.js";

export type SupportedExtension = ".docx" | ".pdf" | ".html" | ".doc";

export interface ExtractionResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  extension: SupportedExtension;
  text: string;
  charCount: number;
}

export interface ParseData {
  spec: ExtractionResult;
  blueprint: ExtractionResult | null;
}

const SUPPORTED_EXTENSIONS: SupportedExtension[] = [".docx", ".pdf", ".html", ".doc"];

export function extensionOf(originalname: string): SupportedExtension | null {
  const ext = path.extname(originalname).toLowerCase() as SupportedExtension;
  return SUPPORTED_EXTENSIONS.includes(ext) ? ext : null;
}

export function supportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS];
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const [rawText, html] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  const $ = cheerio.load(html.value ?? "");
  const tableRows = $("table tr")
    .map((_, row) =>
      $(row)
        .find("th, td")
        .map((_, cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .get()
        .join(" | ")
    )
    .get()
    .filter((row) => row.trim().length > 0);

  return [rawText.value ?? "", ...(tableRows.length > 0 ? ["\nStructured table rows:\n", ...tableRows] : [])].join("\n");
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text ?? "";
}

async function extractHtml(buffer: Buffer): Promise<string> {
  const html = buffer.toString("utf8");
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg").remove();
  return $.text();
}

async function extractDoc(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(buffer);
  return extracted.getBody() ?? "";
}

async function extractRaw(buffer: Buffer, extension: SupportedExtension): Promise<string> {
  switch (extension) {
    case ".docx":
      return extractDocx(buffer);
    case ".pdf":
      return extractPdf(buffer);
    case ".html":
      return extractHtml(buffer);
    case ".doc":
      return extractDoc(buffer);
    default:
      throw new ApiError(400, "UNSUPPORTED_FILE_TYPE", `Unsupported extension '${extension}'.`);
  }
}

export async function extractFile(file: Express.Multer.File): Promise<ExtractionResult> {
  const name = file.originalname ?? "(unnamed)";
  if (!file.buffer || file.buffer.length === 0) {
    throw new ApiError(400, "EMPTY_FILE", `${name} is empty.`);
  }

  const extension = extensionOf(name);
  if (!extension) {
    throw new ApiError(
      400,
      "UNSUPPORTED_FILE_TYPE",
      `Unsupported file type. Supported extensions: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }

  let rawText: string;
  try {
    rawText = await extractRaw(file.buffer, extension);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      400,
      "EXTRACTION_FAILED",
      `Failed to extract text from ${name}: ${(e as Error).message}`
    );
  }

  const text = normalizeWhitespace(rawText);
  if (!text || text.length === 0) {
    throw new ApiError(400, "NO_USABLE_TEXT", `No usable text could be extracted from ${name}.`);
  }

  return {
    filename: file.filename,
    originalname: name,
    mimetype: file.mimetype,
    size: file.size,
    extension,
    text,
    charCount: text.length,
  };
}
