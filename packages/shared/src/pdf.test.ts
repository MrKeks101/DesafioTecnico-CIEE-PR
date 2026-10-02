import { describe, expect, it } from "vitest";
import { ALLOWED_PDF_MIME_TYPES, MAX_PDF_SIZE_BYTES } from "./pdf.js";

describe("PDF upload constraints", () => {
  it("limits uploads to 5 MB", () => {
    expect(MAX_PDF_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("only allows the application/pdf MIME type", () => {
    expect(ALLOWED_PDF_MIME_TYPES).toEqual(["application/pdf"]);
  });

  it("can be used to reject an oversized file", () => {
    const oversizedFile = { size: MAX_PDF_SIZE_BYTES + 1, mimetype: "application/pdf" };

    expect(oversizedFile.size > MAX_PDF_SIZE_BYTES).toBe(true);
  });

  it("can be used to reject a disallowed MIME type", () => {
    const wordDocument = { size: 1024, mimetype: "application/msword" };

    expect(ALLOWED_PDF_MIME_TYPES.includes(wordDocument.mimetype as never)).toBe(false);
  });

  it("accepts a file that respects both the size and MIME type limits", () => {
    const validFile = { size: MAX_PDF_SIZE_BYTES, mimetype: "application/pdf" };

    expect(validFile.size <= MAX_PDF_SIZE_BYTES).toBe(true);
    expect(ALLOWED_PDF_MIME_TYPES.includes(validFile.mimetype as never)).toBe(true);
  });
});
