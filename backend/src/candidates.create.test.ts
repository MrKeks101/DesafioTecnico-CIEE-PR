import { SUMMARY_MAX_LENGTH } from "shared";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./db/client.js";

describe("POST /api/candidates", () => {
  const createdIds: number[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.candidate.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it("persists a candidate with only the required fields and returns 201", async () => {
    const response = await request(app).post("/api/candidates").send({
      fullName: "Maria Souza",
      email: "maria.souza@example.com",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Cadastro salvo com sucesso.");
    expect(response.body.data.id).toEqual(expect.any(Number));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(response.body.data.fullName).toBe("Maria Souza");
    expect(response.body.data.email).toBe("maria.souza@example.com");

    createdIds.push(response.body.data.id);
  });

  it("persists a candidate with every field filled", async () => {
    const payload = {
      fullName: "João Pereira",
      email: "joao.pereira@example.com",
      phone: "(41) 99999-0000",
      areaOfInterest: "Desenvolvimento de Software",
      summary: "Resumo profissional de teste com algumas frases.",
    };

    const response = await request(app).post("/api/candidates").send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(payload);
    expect(response.body.data.id).toEqual(expect.any(Number));
    expect(response.body.data.createdAt).toEqual(expect.any(String));

    createdIds.push(response.body.data.id);
  });

  it("rejects a payload missing fullName with 400 and a message for that field", async () => {
    const response = await request(app).post("/api/candidates").send({
      email: "sem-nome@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields.fullName).toEqual(expect.any(String));
  });

  it("rejects a payload missing email with 400 and a message for that field", async () => {
    const response = await request(app).post("/api/candidates").send({
      fullName: "Sem Email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields.email).toEqual(expect.any(String));
  });

  it("rejects a payload with an invalid email format with 400 and a message for that field", async () => {
    const response = await request(app).post("/api/candidates").send({
      fullName: "Email Invalido",
      email: "nao-e-um-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields.email).toEqual(expect.any(String));
  });

  it("rejects an optional field above its size limit with 400", async () => {
    const response = await request(app)
      .post("/api/candidates")
      .send({
        fullName: "Resumo Gigante",
        email: "resumo.gigante@example.com",
        summary: "a".repeat(SUMMARY_MAX_LENGTH + 1),
      });

    expect(response.status).toBe(400);
    expect(response.body.error.fields.summary).toEqual(expect.any(String));
  });

  it("never responds 500 for invalid input, even with multiple failing fields at once", async () => {
    const response = await request(app).post("/api/candidates").send({});

    expect(response.status).toBe(400);
    expect(response.body.error.fields.fullName).toEqual(expect.any(String));
    expect(response.body.error.fields.email).toEqual(expect.any(String));
  });
});
