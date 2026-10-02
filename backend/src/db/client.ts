import { PrismaClient } from "@prisma/client";

/**
 * Single shared `PrismaClient` instance for the whole backend process.
 *
 * Route handlers import this instead of constructing their own client, so
 * the connection pool is reused across requests (and across route modules —
 * see docs/tickets/004-candidate-create-endpoint.md, which this module was
 * introduced for, and tickets 005/006 which reuse it for listing/detail).
 */
export const prisma = new PrismaClient();
