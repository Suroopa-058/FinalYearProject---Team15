import { createApp } from "./app/app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { getMlServiceHealth } from "./ml/fastapi-client";
import { ensurePlatformAdmin } from "./services/admin.service";

async function main(): Promise<void> {
  await ensurePlatformAdmin();
  const app = createApp();

  // Best-effort check at boot — logs whether the FastAPI ML service is
  // reachable yet, but never blocks startup on it (the ML service and
  // this backend can be started in either order).
  const mlHealth = await getMlServiceHealth();
  if (mlHealth) {
    logger.info("ScholarMatch ML service is reachable", {
      url: env.ML_SERVICE_URL,
      modelsLoaded: mlHealth.models_loaded,
      sbertLoaded: mlHealth.sbert_loaded,
      numScholarships: mlHealth.num_scholarships,
    });
  } else {
    logger.warn("ScholarMatch ML service is not reachable yet — recommendations will report this until it is", {
      url: env.ML_SERVICE_URL,
    });
  }

  app.listen(env.PORT, () => {
    logger.info(`ScholarMatch backend listening on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      corsOrigins: env.corsOrigins,
    });
  });
}

main().catch((err) => {
  logger.error("Fatal error during backend startup", { error: (err as Error).message });
  process.exit(1);
});
