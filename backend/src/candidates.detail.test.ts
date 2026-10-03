import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./db/client.js";

describe("GET /api/candidates/:id", () => {
  let candidateId: number;

  beforeEach(async () => {
    const candidate = await prisma.candidate.create({
      data: {
        fullName: "Elisa Fontoura",
        email: "elisa.fontoura@example.com",
        phone: "(41) 96666-0000",
        areaOfInterest: "Recursos Humanos",
        summary: "Resumo profissional completo para o teste de detalhe.",
      },
    });
    candidateId = candidate.id;
  });

  afterEach(async () => {
    await prisma.candidate.deleteMany({ where: { id: candidateId } });
  });

  it("returns 200 with the full candidate, including summary, for an existing id", async () => {
    const response = await request(app).get(`/api/candidates/${candidateId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: candidateId,
      fullName: "Elisa Fontoura",
      email: "elisa.fontoura@example.com",
      phone: "(41) 96666-0000",
      areaOfInterest: "Recursos Humanos",
      summary: "Resumo profissional completo para o teste de detalhe.",
    });
    expect(response.body.data.createdAt).toEqual(expect.any(String));
  });

  it("returns 404 with a clear message for a numeric id that has no matching candidate", async () => {
    const missingId = candidateId + 1_000_000;

    const response = await request(app).get(`/api/candidates/${missingId}`);

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("Candidato não encontrado.");
  });

  it("returns 400 with a clear message for a non-numeric id, instead of 500", async () => {
    const response = await request(app).get("/api/candidates/abc");

    expect(response.status).toBe(400);
    expect(response.body.error.message).toEqual(expect.any(String));
  });
});
