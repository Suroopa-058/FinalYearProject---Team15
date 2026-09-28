import { getProfileById } from "./profile.service";
import { requestExplanation } from "../ml/fastapi-client";
import { toMlStudentWire } from "../ml/profile-mapper";
import type { MlExplainResponseWire } from "../ml/wire-types";

/**
 * explainRecommendation(profileId, scholarshipId)
 * ------------------------------------------------------------------------
 * Proxies the ML service's POST /api/explain (src/ml/fastapi-client.ts),
 * which runs SHAP TreeExplainer over the same 4 trained models used for
 * scoring (see fastapi_integration/explain.py). No explanation math
 * happens in Node — this only builds the same wire request the
 * recommendation service uses and forwards it.
 */
export async function explainRecommendation(
  profileId: string,
  scholarshipId: string,
): Promise<MlExplainResponseWire> {
  const profile = await getProfileById(profileId);
  const wireRequest = toMlStudentWire(profile); // throws a clear 400 if fields are missing
  return requestExplanation(wireRequest, scholarshipId);
}
