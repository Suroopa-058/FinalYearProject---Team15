import express, { type Express } from "express";
import cors from "cors";
import { corsOptions } from "../config/cors";
import { requestLogger } from "../middleware/request-logger.middleware";
import { notFoundHandler } from "../middleware/not-found.middleware";
import { errorHandler } from "../middleware/error-handler.middleware";
import { apiRouter } from "../routes";

export function createApp(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api", apiRouter);

  // Order matters: 404 handler, then the error handler, both AFTER routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
