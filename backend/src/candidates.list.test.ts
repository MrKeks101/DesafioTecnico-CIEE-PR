import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./db/client.js";

describe("GET /api/candidates", () => {
  const createdIds: number[] = [];

  beforeEach(() => {
    createdIds.length = 0;
  });

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.candidate.deleteMany({ where: { id: { in: createdIds } } });
    }
  });

  it("returns 200 with an empty list when there are no candidates", async () => {
    const response = await request(app).get("/api/candidates");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  it("returns 200 with every candidate ordered by createdAt desc (most recent first)", async () => {
    // Explicit, well-separated createdAt values so ordering is asserted
    // deterministically instead of relying on insertion speed.
    const oldest = await prisma.candidate.create({
      data: {
        fullName: "Ana Oliveira",
        email: "ana.oliveira@example.com",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      },
    });
    createdIds.push(oldest.id);

    const middle = await prisma.candidate.create({
      data: {
        fullName: "Bruno Lima",
        email: "bruno.lima@example.com",
        phone: "(41) 98888-0000",
        areaOfInterest: "Suporte Técnico",
        createdAt: new Date("2024-06-01T10:00:00.000Z"),
      },
    });
    createdIds.push(middle.id);

    const newest = await prisma.candidate.create({
      data: {
        fullName: "Carla Mendes",
        email: "carla.mendes@example.com",
        summary: "Resumo profissional de teste.",
        createdAt: new Date("2024-12-01T10:00:00.000Z"),
      },
    });
    createdIds.push(newest.id);

    const response = await request(app).get("/api/candidates");

    expect(response.status).toBe(200);
    // Filtered to this test's own ids — file-level parallelism is disabled
    // (backend/vitest.config.ts), but asserting only on known ids keeps this
    // test robust even if that ever changes.
    const ids = response.body.data
      .map((candidate: { id: number }) => candidate.id)
      .filter((id: number) => createdIds.includes(id));
    expect(ids).toEqual([newest.id, middle.id, oldest.id]);
  });

  it("includes id, fullName, email, phone, areaOfInterest and createdAt for each item", async () => {
    const candidate = await prisma.candidate.create({
      data: {
        fullName: "Daniela Rocha",
        email: "daniela.rocha@example.com",
        phone: "(41) 97777-0000",
        areaOfInterest: "Design",
        summary: "Resumo completo de teste.",
      },
    });
    createdIds.push(candidate.id);

    const response = await request(app).get("/api/candidates");

    expect(response.status).toBe(200);
    const item = response.body.data.find((c: { id: number }) => c.id === candidate.id);
    expect(item).toMatchObject({
      id: candidate.id,
      fullName: "Daniela Rocha",
      email: "daniela.rocha@example.com",
      phone: "(41) 97777-0000",
      areaOfInterest: "Design",
    });
    expect(item.createdAt).toEqual(expect.any(String));
  });

  it("never responds 500, even immediately after the table was emptied", async () => {
    await prisma.candidate.deleteMany({});

    const response = await request(app).get("/api/candidates");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });
});
