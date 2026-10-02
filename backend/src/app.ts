import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response, type Router } from "express";
import { candidatesRouter } from "./candidates.js";

/**
 * Builds an Express application instance.
 *
 * `extraRouters` exists purely for testability: it lets tests mount a
 * throwaway router (e.g. one that always throws) *before* the 404 and
 * error-handling middleware, without needing those test-only routes to live
 * in the production app. Production code should just use the default
 * `app` export below.
 */
export function buildApp(extraRouters: Router[] = []) {
  const app = express();

  app.use(cors());
  // JSON body parser for manual registration requests. PDF uploads use
  // multer (multipart/form-data), which bypasses this parser entirely — kept
  // small on purpose since no payload here carries file contents.
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(candidatesRouter);

  for (const router of extraRouters) {
    app.use(router);
  }

  // 404 handler for unknown routes — must come after all real routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { message: "Rota não encontrada" } });
  });

  // Central error handler — must be the last middleware registered (4-arg
  // signature is how Express recognizes an error handler). Never leaks a
  // stack trace to the client.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: { message: "Erro interno do servidor" } });
  };
  app.use(errorHandler);

  return app;
}

export const app = buildApp();
