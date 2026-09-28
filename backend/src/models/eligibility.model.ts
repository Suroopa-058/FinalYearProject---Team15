/**
 * EligibilityResult
 * ------------------------------------------------------------------------
 * Deterministic, rule-based eligibility check (NOT the ML model).
 * This mirrors the "gap analysis" table already designed in the frontend
 * (requirement / yourValue / required / gap / status).
 */

export type EligibilityStatus = "met" | "partial" | "not-met";

export interface EligibilityCriterionResult {
  requirement: string;
  yourValue: string;
  required: string;
  status: EligibilityStatus;
  gap?: string;
}

export interface EligibilityResult {
  scholarshipId: string;
  eligible: boolean; // true only if every criterion is "met"
  criteria: EligibilityCriterionResult[];
  evaluatedAt: string;
}
