import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { ApiError, fail, ok } from "./envelope.js";
import { configFromRequest, generateJson } from "./llm.js";
import { extractFile, type ParseData } from "./extract.js";
import { runGenerationPipeline } from "./pipeline.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const api = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

api.get("/health", (_req, res) => ok(res, { status: "up" }));

// Extracts text from an uploaded course specification (and optional blueprint).
// No AI interpretation happens here; that belongs to M2.
api.post(
  "/parse",
  upload.fields([{ name: "spec", maxCount: 1 }, { name: "blueprint", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const specArray = files?.spec;
      if (!specArray || specArray.length === 0) {
        return fail(res, 400, "MISSING_SPEC", "The 'spec' file is required.");
      }
      const specFile = specArray[0];
      const blueprintArray = files?.blueprint;
      const blueprintFile = blueprintArray && blueprintArray.length > 0 ? blueprintArray[0] : null;

      const spec = await extractFile(specFile);
      const blueprint = blueprintFile ? await extractFile(blueprintFile) : null;

      ok(res, { spec, blueprint } as ParseData);
    } catch (e) {
      next(e);
    }
  }
);

// "Test key" button in Settings. Proves the key and model work, nothing more.
api.get("/llm-check", async (req, res, next) => {
  try {
    const cfg = configFromRequest(req);
    const out = await generateJson('Return exactly {"pong": true}', z.object({ pong: z.boolean() }), cfg);
    ok(res, { provider: cfg.provider, model: cfg.model, reply: out });
  } catch (e) {
    next(e);
  }
});

// Your routes go here (Level 1 onward).

// The scorer runs your app and calls this route with the sample files, exactly like `npm run verify` does.
// Contract: multipart fields "spec" (required) and "blueprint" (optional), AI key in the x-llm-* headers.
// Reply: { success: true, data: { output: <specforge_output object>, html: "<the filled spec document>" } }
api.post(
  "/generate",
  upload.fields([{ name: "spec", maxCount: 1 }, { name: "blueprint", maxCount: 1 }]),
  async (req, res, next) => {
    try {
      const config = configFromRequest(req);
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const specArray = files?.spec;
      if (!specArray || specArray.length === 0) {
        return fail(res, 400, "MISSING_SPEC", "The 'spec' file is required.");
      }
      const specFile = specArray[0];
      const blueprintArray = files?.blueprint;
      const blueprintFile = blueprintArray && blueprintArray.length > 0 ? blueprintArray[0] : null;

      const result = await runGenerationPipeline(specFile, blueprintFile, config);
      ok(res, result);
    } catch (e) {
      next(e);
    }
  }
);

app.use("/api/v1", api);
app.use("/api", (_req, res) => fail(res, 404, "NOT_FOUND", "No such route"));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) return fail(res, err.status, err.code, err.message);
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "LIMIT_FILE_SIZE"
  ) {
    return fail(res, 413, "FILE_TOO_LARGE", "Uploaded file exceeds the server size limit.");
  }
  console.error("Unhandled:", err instanceof Error ? err.message : "unknown error"); // never log headers or keys
  fail(res, 500, "SERVER_ERROR", "Something went wrong on the server.");
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}/api/v1`));
