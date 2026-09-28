import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  AUTH_TOKEN_SECRET: z.string().min(32, "AUTH_TOKEN_SECRET must be at least 32 characters"),

  DATA_DRIVER: z.string().default("json-file"),
  DATA_DIR: z.string().default("./src/data/db"),

  // ML_SERVICE_* points at the existing FastAPI service that wraps the
  // trained ScholarMatch artifacts (see backend/README.md §ML integration).
  // The old MODEL_ARTIFACT_PATH/MODEL_VERSION vars are gone — Node no
  // longer loads any model directly, it only proxies to this service.
  ML_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  ML_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  LOG_LEVEL: z.string().default("dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly — a misconfigured .env should never surface as a
  // confusing runtime error three requests later.
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  /** Comma-separated CORS_ORIGIN parsed into an array. */
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((o: string) => o.trim()).filter(Boolean),
  isProduction: parsed.data.NODE_ENV === "production",
};
