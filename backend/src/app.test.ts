import { Router } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app, buildApp } from "./app.js";

describe("GET /api/health", () => {
  it("responds 200 with { status: 'ok' }", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("unknown routes", () => {
  it("responds 404 with a JSON error body", async () => {
    const response = await request(app).get("/api/rota-que-nao-existe");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { message: "Rota não encontrada" } });
  });
});

describe("central error handler", () => {
  it("catches a synchronous error thrown inside a route and responds 500 with a generic JSON error, no stack trace", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const throwingRouter = Router();
    throwingRouter.get("/api/__throws", () => {
      throw new Error("boom — detalhe interno que não deve chegar ao cliente");
    });

    const testApp = buildApp([throwingRouter]);

    const response = await request(testApp).get("/api/__throws");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { message: "Erro interno do servidor" } });
    expect(JSON.stringify(response.body)).not.toMatch(/boom/);
    expect(JSON.stringify(response.body)).not.toMatch(/at Object|at Module/);

    consoleErrorSpy.mockRestore();
  });
});
