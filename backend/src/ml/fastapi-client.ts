import { env } from "../config/env";
import { logger } from "../utils/logger";
import { MlServiceHttpError, MlServiceUnreachableError } from "./ml-errors";
import type {
  MlExplainRequestWire,
  MlExplainResponseWire,
  MlHealthResponseWire,
  MlRecommendationResponseWire,
  MlStudentProfileWire,
} from "./wire-types";

/**
 * fastapi-client
 * ------------------------------------------------------------------------
 * A thin proxy to the existing ScholarMatch FastAPI service
 * (fastapi_integration/app.py — see backend/README.md for where that
 * service lives and how to run it). This file contains NO model
 * loading, preprocessing, ensembling, or explanation logic — all of
 * that stays in Python, in the artifacts you already trained and
 * validated. This client only:
 *
 *   1. Serializes a request to the wire format the FastAPI service expects
 *   2. Sends it over HTTP
 *   3. Deserializes the response (or maps a non-2xx response to a typed error)
 *
 * If you ever need to change how a prediction is computed, that change
 * belongs in the Python package, not here.
 */

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ML_SERVICE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new MlServiceUnreachableError(message);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string };
    return body.detail ?? `ML service responded with HTTP ${res.status}`;
  } catch {
    return `ML service responded with HTTP ${res.status}`;
  }
}

/** GET /api/health — best-effort; never throws, returns null if unreachable. */
export async function getMlServiceHealth(): Promise<MlHealthResponseWire | null> {
  try {
    const res = await fetchWithTimeout(`${env.ML_SERVICE_URL}/api/health`, { method: "GET" });
    if (!res.ok) {
      logger.warn("ML service health check returned a non-OK status", { status: res.status });
      return null;
    }
    return (await res.json()) as MlHealthResponseWire;
  } catch (err) {
    logger.warn("ML service health check failed", { error: (err as Error).message });
    return null;
  }
}

/** POST /api/recommend — proxies to recommendation_service.recommend_scholarships. */
export async function requestRecommendations(
  student: MlStudentProfileWire,
): Promise<MlRecommendationResponseWire> {
  const res = await fetchWithTimeout(`${env.ML_SERVICE_URL}/api/recommend`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(student),
  });

  if (!res.ok) {
    throw new MlServiceHttpError(res.status, await parseErrorDetail(res));
  }

  return (await res.json()) as MlRecommendationResponseWire;
}

/** POST /api/explain — proxies to explain.explain_recommendation. */
export async function requestExplanation(
  student: MlStudentProfileWire,
  scholarshipId: string,
): Promise<MlExplainResponseWire> {
  const payload: MlExplainRequestWire = { student, scholarship_id: scholarshipId };

  const res = await fetchWithTimeout(`${env.ML_SERVICE_URL}/api/explain`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new MlServiceHttpError(res.status, await parseErrorDetail(res));
  }

  return (await res.json()) as MlExplainResponseWire;
}
