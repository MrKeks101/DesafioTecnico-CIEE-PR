import { Router, type Request, type Response } from "express";
import { candidateSchema } from "shared";
import type { ZodError } from "zod";
import { prisma } from "./db/client.js";

/**
 * Converts a Zod validation error into the `{ <field>: <message> }` shape
 * used by the API's error responses (docs/tickets/004-candidate-create-
 * endpoint.md: "mensagem clara por campo, reaproveitando os issues do
 * Zod"). Exported for unit testing independent of the HTTP layer.
 *
 * When a field has more than one issue, the first message wins — the form
 * only needs one message per field to show inline.
 */
export function formatFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fields)) {
      fields[field] = issue.message;
    }
  }
  return fields;
}

export const candidatesRouter = Router();

// POST /api/candidates — the single persistence route for candidate
// registration. Both the manual form and the PDF-assisted flow (ticket 014)
// build a payload and call this same route, so both paths share not only
// the same validation (packages/shared) but the same write path.
candidatesRouter.post("/api/candidates", async (req: Request, res: Response) => {
  const result = candidateSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: {
        message: "Dados de cadastro inválidos.",
        fields: formatFieldErrors(result.error),
      },
    });
    return;
  }

  // Express 5 forwards rejected promises from async handlers to the error
  // handler automatically, so a Prisma failure here lands as a generic 500
  // via app.ts's errorHandler rather than crashing the process.
  const candidate = await prisma.candidate.create({ data: result.data });

  res.status(201).json({
    data: candidate,
    message: "Cadastro salvo com sucesso.",
  });
});

// GET /api/candidates — full listing for the candidates screen, ordered most
// recent first. No pagination in the MVP (see "Questões abertas" in
// docs/requirements/cadastro-de-candidatos.md) — an empty table is a valid
// 200 response, not an error.
candidatesRouter.get("/api/candidates", async (_req: Request, res: Response) => {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ data: candidates });
});

// GET /api/candidates/:id — detail screen, full record including `summary`
// (docs/requirements/cadastro-de-candidatos.md, requisito funcional 7). `id`
// is validated as an integer before hitting Prisma: a non-numeric id (e.g.
// "abc") would otherwise reach Prisma as an invalid query argument and
// surface as a generic 500 via app.ts's error handler, instead of the clear
// 400 the ticket asks for.
//
// Exported so the array case (`req.params.id` typed as `string | string[]`
// by Express 5) can be unit-tested directly — HTTP path params can't produce
// an array, so supertest alone can't reach that branch.
export async function getCandidateById(req: Request, res: Response): Promise<void> {
  // Typed as `unknown` on purpose: Express 5 may hand back `string | string[]`,
  // so anything that isn't a plain digit string is treated as an invalid id.
  const id: unknown = req.params.id;

  if (typeof id !== "string" || !/^\d+$/.test(id)) {
    res.status(400).json({
      error: { message: "Id de candidato inválido." },
    });
    return;
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: Number(id) },
  });

  if (!candidate) {
    res.status(404).json({
      error: { message: "Candidato não encontrado." },
    });
    return;
  }

  res.status(200).json({ data: candidate });
}

candidatesRouter.get("/api/candidates/:id", getCandidateById);
