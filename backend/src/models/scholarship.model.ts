/**
 * Scholarship
 * ------------------------------------------------------------------------
 * Structured scholarship record for the Node backend's OWN scholarship
 * catalog (used by GET /api/scholarships and the rule-based
 * eligibility.service.ts). `eligibilityCriteria` is intentionally
 * machine-checkable (unlike the frontend's current free-text
 * `eligibility` string) so eligibility can be evaluated deterministically.
 *
 * NOTE: this is a separate catalog from the 10 scholarships
 * (SCH001-SCH010) the ScholarMatch ML service scores — see
 * backend/README.md's ML integration section for why, and
 * src/models/recommendation.model.ts for the ML-scored shape.
 */

export interface EligibilityCriteria {
  minGpa?: number; // 0-10 scale
  fieldsOfStudy?: string[]; // e.g. ["Computer Science", "Any STEM"]
  studentCategories?: string[]; // e.g. ["OBC", "SC"]
  maxIncomeBracket?: string; // matches StudentProfile.incomeBracket
  requiresFirstGeneration?: boolean;
  requiresRuralBackground?: boolean;
  genderRestriction?: string; // e.g. "female" — omitted when not restricted
  minYearOfStudy?: number;
  otherNotes?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: string;

  amount: number; // numeric amount for sorting/filtering
  currency: string; // e.g. "USD"

  category: string; // e.g. "Merit", "Leadership", "Diversity", "Need-based"
  tags: string[];

  description: string;
  requirements: string[]; // documents needed, e.g. "Essay (500 words)"
  eligibilityCriteria: EligibilityCriteria;

  deadline: string; // ISO date string
  renewable: boolean;
  applicantsCount?: number;

  logo?: string;
  accentColor?: string;

  /** Present for scholarships managed by a verified university. */
  postedByUniversityId?: string;
  status?: "draft" | "pending_review" | "published";

  createdAt: string;
  updatedAt: string;
}

export type CreateScholarshipInput = Omit<Scholarship, "id" | "createdAt" | "updatedAt">;
