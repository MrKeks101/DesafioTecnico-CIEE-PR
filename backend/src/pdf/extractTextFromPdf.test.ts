import { describe, expect, it } from "vitest";
import { PdfReadError, extractTextFromPdf } from "./extractTextFromPdf.js";

/**
 * Builds a tiny but structurally valid single-page PDF with one line of text,
 * computing the xref offsets in code so no binary fixture file is needed.
 */
function buildSimplePdf(line: string): Buffer {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    (() => {
      const stream = `BT /F1 24 Tf 72 720 Td (${line}) Tj ET`;
      return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    })(),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, "latin1");
}

describe("extractTextFromPdf", () => {
  it("extracts the text of a valid PDF", async () => {
    const pdf = buildSimplePdf("Maria Souza");

    const text = await extractTextFromPdf(pdf);

    expect(text).toContain("Maria Souza");
  });

  it("throws a PdfReadError when the buffer is not a PDF", async () => {
    await expect(extractTextFromPdf(Buffer.from("not a pdf"))).rejects.toBeInstanceOf(
      PdfReadError,
    );
  });

  it("throws a PdfReadError with the original parser error as cause", async () => {
    const error = await extractTextFromPdf(Buffer.from("not a pdf")).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PdfReadError);
    expect((error as PdfReadError).name).toBe("PdfReadError");
    expect((error as PdfReadError).cause).toBeDefined();
  });

  it("throws a PdfReadError for an empty buffer", async () => {
    await expect(extractTextFromPdf(Buffer.alloc(0))).rejects.toBeInstanceOf(PdfReadError);
  });
});
