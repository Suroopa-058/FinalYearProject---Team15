/**
 * Recommendation
 * ------------------------------------------------------------------------
 * Shape returned by POST /api/recommendations. Every field here is a
 * direct pass-through (renamed to camelCase) of what the ScholarMatch
 * FastAPI service actually computed via its trained models — see
 * src/ml/wire-types.ts for the exact wire contract, and
 * src/services/recommendation.service.ts for the mapping. Nothing here
 * is invented client-side.
 */

export interface Recommendation {
  rank: number;
  scholarshipId: string;
  name: string;
  description: string;
  /** 4-model ensemble probability, 0-1, exactly as returned by the ML service. */
  score: number;
  /** Convenience field for UI display: Math.round(score * 100), e.g. 96. */
  matchPercentage: number;
  /** The ML service's own global eligibility rule (gpa/credits/year/failed-course). */
  eligible: boolean;
  semanticSimilarity: number;
  majorMatch: boolean;
  academicFit: number;
}

export interface RecommendationResult {
  /** False if the FastAPI ML service could not be reached at all. */
  mlServiceReachable: boolean;
  /** The (possibly derived) integer id sent to the ML service, once reachable. */
  studentId: number | null;
  /** Human-readable description of the model actually used, for display/logging. */
  modelVersion: string | null;
  generatedAt: string;
  recommendations: Recommendation[];
  message?: string;
}
