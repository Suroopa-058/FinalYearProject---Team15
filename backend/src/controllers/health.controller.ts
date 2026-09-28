import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import { getMlServiceHealth } from "../ml/fastapi-client";
import { env } from "../config/env";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const mlHealth = await getMlServiceHealth(); // never throws; null if unreachable

  sendSuccess(res, {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    environment: env.NODE_ENV,
    mlService: {
      url: env.ML_SERVICE_URL,
      reachable: mlHealth !== null,
      modelsLoaded: mlHealth?.models_loaded ?? false,
      sbertLoaded: mlHealth?.sbert_loaded ?? false,
      numScholarships: mlHealth?.num_scholarships ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
}
