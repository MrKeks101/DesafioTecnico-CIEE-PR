import { PDFParse } from "pdf-parse";

/**
 * Raised when the buffer cannot be read as a PDF (corrupted, encrypted,
 * not a PDF at all, ...). Callers decide how to answer — the import route
 * (ticket 013) turns it into a non-blocking warning, never a 500, because a
 * failed read must not prevent manual registration (specs.md, linha 13).
 */
export class PdfReadError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Não foi possível ler o texto do PDF.", options);
    this.name = "PdfReadError";
  }
}

/**
 * Extracts the plain text of a PDF held in memory. Wraps `pdf-parse` so the
 * rest of the backend never depends on its API directly.
 *
 * Returns the raw text as produced by the parser (may be an empty string for
 * PDFs without an extractable text layer, e.g. scanned images — that is not
 * treated as an error here; see importacao-pdf.md, Non-goals).
 *
 * @throws {PdfReadError} if the parser fails on the buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let parser: PDFParse | undefined;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (cause) {
    throw new PdfReadError({ cause });
  } finally {
    // pdf-parse holds worker/memory resources until destroy() is called.
    await parser?.destroy().catch(() => undefined);
  }
}
