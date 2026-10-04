import { describe, expect, it } from "vitest";
import {
  AREA_OF_INTEREST_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  SUMMARY_MAX_LENGTH,
  candidateSchema,
} from "../src/candidate.js";

describe("candidateSchema", () => {
  it("rejects a payload without fullName", () => {
    const result = candidateSchema.safeParse({
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fullNameIssue = result.error.issues.find((issue) => issue.path[0] === "fullName");
      expect(fullNameIssue).toBeDefined();
      expect(fullNameIssue?.message).toMatch(/obrigatório/i);
    }
  });

  it("rejects a payload with fullName made only of whitespace", () => {
    const result = candidateSchema.safeParse({
      fullName: "   ",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fullNameIssue = result.error.issues.find((issue) => issue.path[0] === "fullName");
      expect(fullNameIssue).toBeDefined();
      expect(fullNameIssue?.message).toMatch(/obrigatório/i);
    }
  });

  it("rejects a payload without email", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === "email");
      expect(emailIssue).toBeDefined();
      expect(emailIssue?.message).toMatch(/obrigatório/i);
    }
  });

  it("rejects a payload with an invalid email format", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "nao-e-um-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === "email");
      expect(emailIssue).toBeDefined();
      expect(emailIssue?.message).toMatch(/inválido/i);
    }
  });

  it("accepts a payload with only fullName and email, leaving the rest undefined", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.areaOfInterest).toBeUndefined();
      expect(result.data.summary).toBeUndefined();
    }
  });

  it("accepts a complete payload with every field filled in, trimming whitespace", () => {
    const result = candidateSchema.safeParse({
      fullName: "  Maria da Silva  ",
      email: "  candidata@example.com  ",
      phone: " (41) 99999-0000 ",
      areaOfInterest: " Desenvolvimento de Software ",
      summary: " Resumo profissional da candidata. ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        fullName: "Maria da Silva",
        email: "candidata@example.com",
        phone: "(41) 99999-0000",
        areaOfInterest: "Desenvolvimento de Software",
        summary: "Resumo profissional da candidata.",
      });
    }
  });

  it("rejects fullName above the maximum length", () => {
    const result = candidateSchema.safeParse({
      fullName: "a".repeat(FULL_NAME_MAX_LENGTH + 1),
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("rejects email above the maximum length", () => {
    const localPart = "a".repeat(EMAIL_MAX_LENGTH);
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: `${localPart}@example.com`,
    });

    expect(result.success).toBe(false);
  });

  it("rejects phone above the maximum length", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "candidata@example.com",
      phone: "1".repeat(PHONE_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects areaOfInterest above the maximum length", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "candidata@example.com",
      areaOfInterest: "a".repeat(AREA_OF_INTEREST_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects summary above the maximum length", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "candidata@example.com",
      summary: "a".repeat(SUMMARY_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });

  it("accepts a fullName with accented letters", () => {
    const result = candidateSchema.safeParse({
      fullName: "João da Silva",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a fullName with a hyphen and an apostrophe", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria José O'Brien-Santos",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a fullName containing digits", () => {
    const result = candidateSchema.safeParse({
      fullName: "João 123",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fullNameIssue = result.error.issues.find((issue) => issue.path[0] === "fullName");
      expect(fullNameIssue).toBeDefined();
      expect(fullNameIssue?.message).toMatch(/não pode conter números/i);
    }
  });

  it("rejects a fullName made only of digits", () => {
    const result = candidateSchema.safeParse({
      fullName: "123456",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fullNameIssue = result.error.issues.find((issue) => issue.path[0] === "fullName");
      expect(fullNameIssue).toBeDefined();
      expect(fullNameIssue?.message).toMatch(/não pode conter números/i);
    }
  });

  it("rejects a fullName containing other symbols, like an underscore", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria_Silva",
      email: "candidata@example.com",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fullNameIssue = result.error.issues.find((issue) => issue.path[0] === "fullName");
      expect(fullNameIssue).toBeDefined();
      expect(fullNameIssue?.message).toMatch(/não pode conter números/i);
    }
  });

  it("does not enforce a phone format — unusual but valid-looking phone text is accepted", () => {
    const result = candidateSchema.safeParse({
      fullName: "Maria da Silva",
      email: "candidata@example.com",
      phone: "+55 41 9 9999-0000 ramal 12",
    });

    expect(result.success).toBe(true);
  });
});
