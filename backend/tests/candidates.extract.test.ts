import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PDF_SIZE_BYTES } from "shared";
import { app } from "../src/app.js";
import { prisma } from "../src/db/client.js";
import { extractTextFromPdf } from "../src/pdf/extractTextFromPdf.js";

// Wrap the real extractor in a spy so tests can assert whether a file was
// processed at all (e.g. an oversized upload must be rejected before parsing).
vi.mock("../src/pdf/extractTextFromPdf.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/pdf/extractTextFromPdf.js")>();
  return { ...actual, extractTextFromPdf: vi.fn(actual.extractTextFromPdf) };
});

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const fixture = (name: string) => readFileSync(join(FIXTURES_DIR, name));

const VALID_PDF = fixture("curriculo-ficticio-valido.pdf");
const TEXT_ONLY_PDF = fixture("curriculo-sem-contatos.pdf");
const NOT_A_PDF = fixture("nao-e-pdf.txt");

const INVALID_FILE_MESSAGE = "Arquivo inválido: envie um PDF de até 5 MB.";
const MISSING_FILE_MESSAGE = "Nenhum arquivo enviado. Envie um PDF no campo 'file'.";
const READ_WARNING = "Não foi possível ler o PDF. Preencha os campos manualmente.";

const EXTRACT_URL = "/api/candidates/extract";

describe("POST /api/candidates/extract", () => {
  beforeEach(() => {
    vi.mocked(extractTextFromPdf).mockClear();
  });

  describe("valid PDF", () => {
    it("returns 200 with fullName, email and phone when all three are identifiable", async () => {
      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", VALID_PDF, { filename: "curriculo.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          fullName: "Joana Exemplo Teixeira",
          email: "joana.exemplo@example.com",
          phone: "(41) 98765-4321",
        },
      });
      expect(response.body.warning).toBeUndefined();
    });

    it("does not persist anything in the candidates table", async () => {
      const countBefore = await prisma.candidate.count();

      await request(app)
        .post(EXTRACT_URL)
        .attach("file", VALID_PDF, { filename: "curriculo.pdf", contentType: "application/pdf" });

      expect(await prisma.candidate.count()).toBe(countBefore);
    });

    it("returns 200 with data {} and a warning when the PDF is readable but has no identifiable fields", async () => {
      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", TEXT_ONLY_PDF, { filename: "sem-contatos.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({});
      expect(response.body.warning).toEqual(expect.any(String));
      expect(response.body.error).toBeUndefined();
    });

    it("returns 200 with data {} and a warning, not 500, when the PDF is corrupted", async () => {
      const corrupted = Buffer.from("%PDF-1.4\ngarbage that is not a real pdf body");

      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", corrupted, { filename: "corrompido.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: {}, warning: READ_WARNING });
    });

    it("accepts a PDF of exactly the maximum size (5 MB is the limit, not below it)", async () => {
      const atLimit = Buffer.alloc(MAX_PDF_SIZE_BYTES);
      atLimit.write("%PDF-1.4\n", 0, "latin1");

      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", atLimit, { filename: "no-limite.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(200);
      expect(response.body.warning).toBe(READ_WARNING);
    });
  });

  describe("invalid upload", () => {
    it("returns 400 with a clear message when the file is larger than 5 MB, without parsing it", async () => {
      const oversized = Buffer.alloc(MAX_PDF_SIZE_BYTES + 1);
      oversized.write("%PDF-1.4\n", 0, "latin1");

      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", oversized, { filename: "grande.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: INVALID_FILE_MESSAGE } });
      expect(extractTextFromPdf).not.toHaveBeenCalled();
    });

    it("returns 400 with a clear message when the file is a text file, not a PDF", async () => {
      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", NOT_A_PDF, { filename: "nao-e-pdf.txt", contentType: "text/plain" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: INVALID_FILE_MESSAGE } });
      expect(extractTextFromPdf).not.toHaveBeenCalled();
    });

    it("returns 400 when the file is an image, even if named .pdf", async () => {
      const png = Buffer.from("89504e470d0a1a0a", "hex");

      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("file", png, { filename: "foto.pdf", contentType: "image/png" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: INVALID_FILE_MESSAGE } });
    });

    it("returns 400 with a clear message when the file is sent under a field other than 'file'", async () => {
      const response = await request(app)
        .post(EXTRACT_URL)
        .attach("arquivo", VALID_PDF, { filename: "curriculo.pdf", contentType: "application/pdf" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: MISSING_FILE_MESSAGE } });
      expect(extractTextFromPdf).not.toHaveBeenCalled();
    });
  });

  describe("missing file", () => {
    it("returns 400 with a clear message for a multipart request without any file", async () => {
      const response = await request(app).post(EXTRACT_URL).field("nome", "Joana");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: MISSING_FILE_MESSAGE } });
      expect(extractTextFromPdf).not.toHaveBeenCalled();
    });

    it("returns 400 with a clear message for a request with no body at all", async () => {
      const response = await request(app).post(EXTRACT_URL);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: MISSING_FILE_MESSAGE } });
    });

    it("returns 400 for a JSON body, which is not a file upload", async () => {
      const response = await request(app).post(EXTRACT_URL).send({ fullName: "Joana" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: { message: MISSING_FILE_MESSAGE } });
    });
  });
});
