/**
 * Types mirroring ScholarMatch's FastAPI wire contract
 * (fastapi_integration/schemas.py). These are typing-only — every field
 * name and shape matches what the Python service actually sends/expects
 * over HTTP. No prediction, preprocessing, or ensemble logic is
 * reimplemented here; that all still lives in Python and is called over
 * HTTP by fastapi-client.ts.
 */

/** Request body for POST {ML_SERVICE_URL}/api/recommend (schemas.StudentProfile). */
export interface MlStudentProfileWire {
  student_id: number;
  semester: 1 | 2;
  gpa: number; // 0-10
  extracurricular_point: number; // 0-100
  total_credits: number;
  class: string; // e.g. "CS2021" — must be a code the trained class_encoder has seen
  has_failed_course: boolean;
  student_year: number;
}

/** One entry in RecommendationResponse.recommendations (schemas.ScholarshipRecommendation). */
export interface MlScholarshipRecommendationWire {
  rank: number;
  scholarship_id: string;
  name: string;
  description: string;
  recommendation_score: number; // 4-model ensemble probability, 0-1
  semantic_similarity: number;
  major_match: number; // 0 or 1
  eligible: boolean;
  academic_fit: number;
}

/** Response body from POST /api/recommend (schemas.RecommendationResponse). */
export interface MlRecommendationResponseWire {
  student_id: number;
  recommendations: MlScholarshipRecommendationWire[];
}

/** Request body for POST /api/explain (schemas.ExplainRequest). */
export interface MlExplainRequestWire {
  student: MlStudentProfileWire;
  scholarship_id: string;
}

/** One entry in ExplainResponse.explanation (schemas.FeatureExplanation). */
export interface MlFeatureExplanationWire {
  feature: string;
  impact: number;
  direction: "positive" | "negative";
  description: string;
}

/** Response body from POST /api/explain (schemas.ExplainResponse). */
export interface MlExplainResponseWire {
  scholarship_id: string;
  recommendation_score: number;
  explanation: MlFeatureExplanationWire[];
  method: string;
}

/** Response body from GET /api/health (schemas.HealthResponse). */
export interface MlHealthResponseWire {
  status: string;
  models_loaded: boolean;
  sbert_loaded: boolean;
  num_scholarships: number;
}
