import { describe, expect, it } from "vitest";
import { FULL_NAME_MAX_LENGTH } from "shared";
import { extractCandidateFields } from "../../src/pdf/extractCandidateFields.js";

const WELL_BEHAVED_RESUME = `Maria Souza da Silva
Desenvolvedora de Software
maria.souza@example.com
(41) 99999-9999

Resumo
Desenvolvedora com 5 anos de experiência em React e Node.js.`;

describe("extractCandidateFields", () => {
  describe("email", () => {
    it("finds an e-mail in standard format", () => {
      const result = extractCandidateFields("Contato: maria.souza@example.com");

      expect(result.email).toBe("maria.souza@example.com");
    });

    it("uses the first e-mail when the text contains more than one", () => {
      const result = extractCandidateFields(
        "pessoal: maria@gmail.com\nprofissional: maria@empresa.com.br",
      );

      expect(result.email).toBe("maria@gmail.com");
    });

    it("returns email undefined when there is no e-mail in the text", () => {
      const result = extractCandidateFields("Maria Souza\n(41) 99999-9999");

      expect(result.email).toBeUndefined();
    });

    it("does not treat a bare '@' or an incomplete address as an e-mail", () => {
      const result = extractCandidateFields("Siga-nos @maria e escreva para maria@localhost");

      expect(result.email).toBeUndefined();
    });
  });

  describe("phone", () => {
    it.each([
      ["(41) 99999-9999", "(41) 99999-9999"],
      ["41999999999", "41999999999"],
      ["+55 41 99999-9999", "+55 41 99999-9999"],
      ["+55 (41) 3333-4444", "+55 (41) 3333-4444"],
      ["(41) 3333-4444", "(41) 3333-4444"],
      ["41 99999 9999", "41 99999 9999"],
    ])("recognises the Brazilian phone format %s", (phoneText, expected) => {
      const result = extractCandidateFields(`Telefone: ${phoneText}\nSão Paulo`);

      expect(result.phone).toBe(expected);
    });

    it("uses the first phone when the text contains more than one", () => {
      const result = extractCandidateFields("Celular (41) 99999-1111\nAlternativo (11) 98888-2222");

      expect(result.phone).toBe("(41) 99999-1111");
    });

    it("returns phone undefined when there is no recognisable phone", () => {
      const result = extractCandidateFields("Maria Souza\nmaria@example.com\nSão Paulo, SP");

      expect(result.phone).toBeUndefined();
    });

    it("ignores years and date ranges that are not phone numbers", () => {
      const result = extractCandidateFields("Estágio 2019 - 2021\nCEP 80000-000");

      expect(result.phone).toBeUndefined();
    });
  });

  describe("fullName", () => {
    it("takes the first line as the name in a well-behaved resume", () => {
      const result = extractCandidateFields(WELL_BEHAVED_RESUME);

      expect(result.fullName).toBe("Maria Souza da Silva");
      expect(result.email).toBe("maria.souza@example.com");
      expect(result.phone).toBe("(41) 99999-9999");
    });

    it("skips leading blank lines and surrounding whitespace", () => {
      const result = extractCandidateFields("\n\n   Maria Souza   \nDesenvolvedora");

      expect(result.fullName).toBe("Maria Souza");
    });

    it("accepts accented letters, hyphens and apostrophes", () => {
      const result = extractCandidateFields("João Castro-Açaí D'Ávila\nEngenheiro");

      expect(result.fullName).toBe("João Castro-Açaí D'Ávila");
    });

    it("removes contact details from the first line before reading the name", () => {
      const result = extractCandidateFields(
        "Maria Souza | maria@example.com | (41) 99999-9999\nDesenvolvedora",
      );

      expect(result.fullName).toBe("Maria Souza");
      expect(result.email).toBe("maria@example.com");
      expect(result.phone).toBe("(41) 99999-9999");
    });

    it("leaves fullName undefined when the first line is only an e-mail or phone", () => {
      const result = extractCandidateFields("maria@example.com\nMaria Souza\n(41) 99999-9999");

      expect(result.fullName).toBeUndefined();
      expect(result.email).toBe("maria@example.com");
    });

    it("leaves fullName undefined when the first line contains digits", () => {
      const result = extractCandidateFields("Currículo 2026\nMaria Souza");

      expect(result.fullName).toBeUndefined();
    });

    it("leaves fullName undefined when the first line is a single word", () => {
      const result = extractCandidateFields("CURRÍCULO\nMaria Souza\nmaria@example.com");

      expect(result.fullName).toBeUndefined();
    });

    it("leaves fullName undefined when the first line is longer than the maximum", () => {
      const longLine = `${"Maria ".repeat(FULL_NAME_MAX_LENGTH)}Souza`;
      const result = extractCandidateFields(`${longLine}\nDesenvolvedora`);

      expect(result.fullName).toBeUndefined();
    });

    it("does not look past the first non-empty line for a name", () => {
      const result = extractCandidateFields("Curriculum Vitae Profissional\nMaria Souza");

      expect(result.fullName).toBe("Curriculum Vitae Profissional");
    });
  });

  describe("empty and unrecognisable input", () => {
    it("returns all three fields undefined for an empty string without throwing", () => {
      const result = extractCandidateFields("");

      expect(result).toEqual({});
      expect(result.fullName).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it("returns all three fields undefined for whitespace-only text", () => {
      const result = extractCandidateFields("  \n\t\n   ");

      expect(result).toEqual({});
    });

    it("returns all three fields undefined for text with none of the fields", () => {
      const result = extractCandidateFields("1234 5678 !!! ### ---");

      expect(result).toEqual({});
    });
  });
});
