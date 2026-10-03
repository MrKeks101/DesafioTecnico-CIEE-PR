import { Router, type NextFunction, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import { ALLOWED_PDF_MIME_TYPES, MAX_PDF_SIZE_BYTES } from "shared";
import { extractCandidateFields } from "./pdf/extractCandidateFields.js";
import { PdfReadError, extractTextFromPdf } from "./pdf/extractTextFromPdf.js";

// Messages are part of the API contract (docs/tickets/013). The size is derived
// from the shared constant so "5 MB" is not hard-coded in a second place.
const MAX_PDF_SIZE_MB = MAX_PDF_SIZE_BYTES / (1024 * 1024);

export const PDF_INVALID_MESSAGE = `Arquivo inválido: envie um PDF de até ${MAX_PDF_SIZE_MB} MB.`;
export const PDF_MISSING_MESSAGE = "Nenhum arquivo enviado. Envie um PDF no campo 'file'.";
export const PDF_READ_WARNING = "Não foi possível ler o PDF. Preencha os campos manualmente.";
export const PDF_NO_FIELDS_WARNING =
  "Não foi possível identificar nome, e-mail ou telefone no PDF. Preencha os campos manualmente.";

/** Name of the multipart field carrying the PDF. */
const FILE_FIELD = "file";

/** Thrown by multer's fileFilter when the MIME type is not an allowed PDF type. */
class InvalidPdfTypeError extends Error {
  constructor() {
    super("Tipo de arquivo não permitido.");
    this.name = "InvalidPdfTypeError";
  }
}

// Keeps the upload in memory only: the PDF is never written to disk and is
// discarded once the response is sent (importacao-pdf.md, non-goals).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE_BYTES, files: 1 },
  fileFilter(_req, file, callback) {
    if ((ALLOWED_PDF_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new InvalidPdfTypeError());
    }
  },
});

/**
 * Runs multer and converts any upload failure into a `400` JSON response, so
 * the client never gets a 500 because of a bad upload. A request that sent a
 * file under the wrong field name is reported as "no file" (the field is the
 * contract); every other failure (wrong type, too large, malformed multipart)
 * is reported as an invalid file.
 */
function receivePdf(req: Request, res: Response, next: NextFunction): void {
  upload.single(FILE_FIELD)(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    const isUnexpectedField =
      error instanceof MulterError && error.code === "LIMIT_UNEXPECTED_FILE";
    res.status(400).json({
      error: { message: isUnexpectedField ? PDF_MISSING_MESSAGE : PDF_INVALID_MESSAGE },
    });
  });
}

/**
 * `POST /api/candidates/extract` handler. Reads the uploaded PDF and returns
 * whatever contact fields can be identified. Never persists anything and never
 * fails because of the PDF content: an unreadable PDF or one without
 * identifiable fields still answers `200`, so manual registration is never
 * blocked (specs.md, linha 13).
 *
 * Exported so the route logic can be exercised without going through multer.
 */
export async function extractCandidateFromPdf(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: { message: PDF_MISSING_MESSAGE } });
    return;
  }

  let text: string;
  try {
    text = await extractTextFromPdf(req.file.buffer);
  } catch (error) {
    if (error instanceof PdfReadError) {
      res.status(200).json({ data: {}, warning: PDF_READ_WARNING });
      return;
    }
    throw error;
  }

  const data = extractCandidateFields(text);

  if (Object.keys(data).length === 0) {
    res.status(200).json({ data, warning: PDF_NO_FIELDS_WARNING });
    return;
  }

  res.status(200).json({ data });
}

export const candidatesExtractRouter = Router();

candidatesExtractRouter.post("/api/candidates/extract", receivePdf, extractCandidateFromPdf);
