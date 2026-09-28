import morgan from "morgan";
import { env } from "../config/env";

/** HTTP request logging. Uses "dev" (colored, concise) outside production. */
export const requestLogger = morgan(env.isProduction ? "combined" : env.LOG_LEVEL);
