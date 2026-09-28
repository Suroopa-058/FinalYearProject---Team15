import type { Recommendation, RecommendationResult } from "../models";
import { getProfileById } from "./profile.service";
import { requestRecommendations } from "../ml/fastapi-client";
import { toMlStudentWire } from "../ml/profile-mapper";
import { MlServiceUnreachableError, MlServiceHttpError } from "../ml/ml-errors";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

const MODEL_DESCRIPTION =
  "4-model soft-voting ensemble (XGBoost + RandomForest + LightGBM + CatBoost, " +
  "25/25/25/25) with SBERT semantic similarity, served by the existing ScholarMatch FastAPI service.";

/**
 * recommendScholarships(profileId)
 * ------------------------------------------------------------------------
 * Real pipeline (all computed in Python, in the existing FastAPI service —
 * see backend/README.md):
 *
 *   student profile -> preprocessing.build_feature_vector (11 features,
 *   exact order from config/feature_columns.json) -> the 4 trained
 *   models' predict_proba -> ensemble.py's 25/25/25/25 soft vote ->
 *   ranked scholarships (the ML service's own 10-scholarship catalog)
 *
 * This function does not compute, approximate, or fall back to any
 * score itself. If the profile is missing the fields the model needs,
 * or the ML service can't be reached, that is reported explicitly
 * instead of guessing.
 */
export async function recommendScholarships(profileId: string): Promise<RecommendationResult> {
  const profile = await getProfileById(profileId);
  const generatedAt = new Date().toISOString();

  let wireRequest;
  try {
    wireRequest = toMlStudentWire(profile);
  } catch (err) {
    if (err instanceof AppError && err.code === "MISSING_ML_ACADEMIC_INPUT") {
      return {
        mlServiceReachable: false,
        studentId: null,
        modelVersion: null,
        generatedAt,
        recommendations: [],
        message: err.message,
      };
    }
    throw err;
  }

  try {
    const wireResponse = await requestRecommendations(wireRequest);

    const recommendations: Recommendation[] = wireResponse.recommendations.map((r) => ({
      rank: r.rank,
      scholarshipId: r.scholarship_id,
      name: r.name,
      description: r.description,
      score: r.recommendation_score,
      matchPercentage: Math.round(r.recommendation_score * 100),
      eligible: r.eligible,
      semanticSimilarity: r.semantic_similarity,
      majorMatch: r.major_match === 1,
      academicFit: r.academic_fit,
    }));

    return {
      mlServiceReachable: true,
      studentId: wireResponse.student_id,
      modelVersion: MODEL_DESCRIPTION,
      generatedAt,
      recommendations,
    };
  } catch (err) {
    if (err instanceof MlServiceUnreachableError) {
      logger.warn("ML service unreachable while generating recommendations", {
        profileId,
        error: err.message,
      });
      return {
        mlServiceReachable: false,
        studentId: null,
        modelVersion: null,
        generatedAt,
        recommendations: [],
        message:
          "The ML recommendation service is not reachable right now. Make sure the " +
          "FastAPI service is running (see backend/README.md) and ML_SERVICE_URL is " +
          "correct, then retry.",
      };
    }

    // A real HTTP error FROM the ML service (e.g. 400 for an unknown class
    // code, or 503 if SBERT failed to load there) — surface it as-is
    // rather than swallowing it, since it's actionable and specific.
    if (err instanceof MlServiceHttpError) {
      throw err;
    }

    throw err;
  }
}
