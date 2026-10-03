import { z } from "zod";

/**
 * Size limits enforced for the optional candidate fields. Chosen to be
 * generous for real-world data while still rejecting absurd payloads.
 */
export const FULL_NAME_MAX_LENGTH = 200;
export const EMAIL_MAX_LENGTH = 255;
export const PHONE_MAX_LENGTH = 30;
export const AREA_OF_INTEREST_MAX_LENGTH = 150;
export const SUMMARY_MAX_LENGTH = 5000;

/**
 * A person's full name: letters (any language/script, including accented
 * Portuguese characters like á, é, í, ó, ú, â, ê, ô, ã, õ, ç), whitespace,
 * hyphens (double-barreled names) and apostrophes (e.g. "O'Brien"). Digits
 * and other symbols are rejected — see ticket 017.
 */
export const FULL_NAME_PATTERN = /^[\p{L}\s'-]+$/u;

/**
 * Single source of truth for candidate validation, shared by the manual
 * registration form and the PDF-import flow (both frontend and backend) —
 * see PROJECT.md decision "Validação com Zod em schema compartilhado".
 *
 * Only `fullName` and `email` are required (specs.md only calls these two
 * out explicitly as "obrigatório"). `phone` is intentionally free text with
 * no format regex — see the open question in
 * docs/requirements/cadastro-de-candidatos.md.
 */
export const candidateSchema = z.object({
  fullName: z
    .string("Nome completo é obrigatório.")
    .trim()
    .min(1, "Nome completo é obrigatório.")
    .max(
      FULL_NAME_MAX_LENGTH,
      `Nome completo deve ter no máximo ${FULL_NAME_MAX_LENGTH} caracteres.`,
    )
    .regex(FULL_NAME_PATTERN, "Nome completo não pode conter números."),
  email: z
    .string("E-mail é obrigatório.")
    .trim()
    .min(1, "E-mail é obrigatório.")
    .max(EMAIL_MAX_LENGTH, `E-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`)
    .email("E-mail em formato inválido."),
  phone: z
    .string()
    .trim()
    .max(PHONE_MAX_LENGTH, `Telefone deve ter no máximo ${PHONE_MAX_LENGTH} caracteres.`)
    .optional(),
  areaOfInterest: z
    .string()
    .trim()
    .max(
      AREA_OF_INTEREST_MAX_LENGTH,
      `Área de interesse deve ter no máximo ${AREA_OF_INTEREST_MAX_LENGTH} caracteres.`,
    )
    .optional(),
  summary: z
    .string()
    .trim()
    .max(SUMMARY_MAX_LENGTH, `Resumo deve ter no máximo ${SUMMARY_MAX_LENGTH} caracteres.`)
    .optional(),
});

export type CandidateInput = z.infer<typeof candidateSchema>;
