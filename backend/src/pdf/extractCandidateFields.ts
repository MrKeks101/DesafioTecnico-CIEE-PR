import { FULL_NAME_MAX_LENGTH, FULL_NAME_PATTERN } from "shared";

export interface ExtractedCandidateFields {
  fullName?: string;
  email?: string;
  phone?: string;
}

/**
 * Standard e-mail shape: local part, "@", domain labels and a TLD of 2+
 * letters. The first match in the text is used (importacao-pdf.md — the
 * primary contact e-mail is not guessed).
 */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/**
 * Brazilian phone numbers, with or without the +55 country code, with or
 * without parentheses around the DDD, with or without spaces/dots/hyphens:
 *
 *   (41) 99999-9999   41999999999   +55 41 99999-9999   +55 (41) 3333-4444
 *
 * DDD (2 digits) + optional mobile leading 9 + 4 digits + 4 digits, i.e.
 * 10 digits (landline) or 11 digits (mobile). The lookbehind/lookahead stop
 * the match from starting or ending inside a longer run of digits or inside
 * a word (e.g. a number glued to an e-mail local part).
 */
const PHONE_PATTERN =
  /(?<![\w+])(?:\+?55[\s.-]?)?(?:\(\d{2}\)[\s.-]?|\d{2}[\s.-]?)9?\d{4}[\s.-]?\d{4}(?!\d)/;

/**
 * Extracts candidate contact fields from already-extracted PDF text.
 *
 * Pure and synchronous: no I/O and it never throws — any field that cannot be
 * identified is left `undefined` so the form can be filled manually.
 *
 * Heuristics and their known limits are documented in
 * docs/requirements/importacao-pdf.md ("Heurística de extração — limitações
 * conhecidas"):
 *
 * - `email`: first e-mail-shaped match in the whole text.
 * - `phone`: first Brazilian-phone-shaped match in the whole text.
 * - `fullName`: taken from the first non-empty line only. Any e-mail/phone
 *   found in that line is removed first (so "Maria Silva | maria@x.com" still
 *   yields "Maria Silva"); the remainder must look like a name (letters,
 *   spaces, hyphens, apostrophes — the same rule as `candidateSchema`), have
 *   at least two words and fit within FULL_NAME_MAX_LENGTH. Otherwise it is
 *   left undefined.
 */
export function extractCandidateFields(text: string): ExtractedCandidateFields {
  const fields: ExtractedCandidateFields = {};

  const email = text.match(EMAIL_PATTERN)?.[0];
  if (email) fields.email = email;

  const phone = text.match(PHONE_PATTERN)?.[0].trim();
  if (phone) fields.phone = phone;

  const fullName = extractFullName(text);
  if (fullName) fields.fullName = fullName;

  return fields;
}

function extractFullName(text: string): string | undefined {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return undefined;

  const candidate = firstLine
    .replace(new RegExp(EMAIL_PATTERN, "g"), " ")
    .replace(new RegExp(PHONE_PATTERN, "g"), " ")
    // Common separators used in resume headers ("Nome | e-mail | telefone").
    .replace(/[|•·,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s'-]+|[\s'-]+$/g, "");

  if (candidate.length === 0 || candidate.length > FULL_NAME_MAX_LENGTH) return undefined;
  if (!FULL_NAME_PATTERN.test(candidate)) return undefined;
  if (candidate.split(" ").length < 2) return undefined;

  return candidate;
}
