/**
 * Shared PDF upload constraints, consumed by both the backend (multer
 * file-size/MIME filter) and the frontend (client-side check before the
 * file is even sent) — see specs.md ("upload aceita apenas PDF, até 5 MB")
 * and docs/requirements/importacao-pdf.md (requirement 2).
 */
export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PDF_MIME_TYPES = ["application/pdf"] as const;

export type AllowedPdfMimeType = (typeof ALLOWED_PDF_MIME_TYPES)[number];
