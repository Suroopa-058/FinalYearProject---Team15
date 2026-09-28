/**
 * StudentProfile
 * ------------------------------------------------------------------------
 * Canonical shape of a student's profile as used across the backend:
 * validation, storage, feature preprocessing, and API responses.
 *
 * This mirrors the fields already collected by the frontend's signup /
 * profile forms (see frontend/src/components/scholar-app.tsx — fullName,
 * phone, dob, gender, degree, institution, yearOfStudy, gpa, category,
 * income) so the two sides line up without needing a translation layer.
 */

export type Gender = "female" | "male" | "non-binary" | "prefer-not-to-say" | "other";

export type IncomeBracket =
  | "below-2lpa"
  | "2-5lpa"
  | "5-10lpa"
  | "above-10lpa"
  | "prefer-not-to-say";

export interface StudentProfile {
  id: string;

  // Identity
  fullName: string;
  email: string;
  phone?: string;
  dob?: string; // ISO date string
  gender?: Gender;

  // Academic
  degree?: string; // e.g. "B.Tech Computer Science"
  /** The university this student belongs to. */
  institutionId?: string;
  /** Preserves an institution label imported from the pre-university schema. */
  legacyInstitutionName?: string;
  yearOfStudy: number; // 1-6
  gpa: number; // 0-10 scale (matches the ML service's expected gpa range exactly)
  fieldOfStudy?: string;

  // Socioeconomic / demographic (used for eligibility matching only —
  // never used to unfairly discriminate; matches scholarship criteria
  // that explicitly target these categories, e.g. first-gen or need-based awards)
  category?: string; // e.g. "General", "OBC", "SC/ST", "First-Gen", etc.
  incomeBracket?: IncomeBracket;
  isFirstGeneration?: boolean;
  ruralBackground?: boolean;

  // Interests / extras that help matching & explainability
  interests?: string[];
  achievements?: string[]; // e.g. "Led team at Smart India Hackathon 2024"

  /**
   * ── Fields required to call the ScholarMatch ML recommendation service ──
   * (see backend/src/ml/fastapi-client.ts, ml/profile-mapper.ts, and
   * backend/README.md). Field names/shape mirror
   * fastapi_integration/schemas.py's StudentProfile so the mapping in
   * ml/profile-mapper.ts is a straight pass-through, not a translation.
   *
   * These are flat, top-level, and OPTIONAL — not grouped in a nested
   * object — because that's the shape PATCH /api/profile/:id actually
   * receives them in. (An earlier nested `mlAcademicInput` design meant
   * these fields didn't match any declared schema key and were silently
   * stripped by Zod on every PATCH; see the git history / CHANGELOG for
   * details of that bug fix.) They are NOT used by
   * eligibility.service.ts's rule-based checks — they exist purely to
   * satisfy the trained model's exact input contract. Leave them unset
   * and POST /api/recommendations will explain what's missing rather
   * than guessing values.
   */
  semester?: 1 | 2;
  extracurricularPoint?: number; // 0-100
  totalCredits?: number;
  hasFailedCourse?: boolean;
  /**
   * Major/class code exactly as encoded by the trained class_encoder,
   * e.g. "CS2021" (2-letter major prefix + 4-digit admission year in the
   * originally trained encoder). An unrecognized code is rejected by the
   * ML service itself with a 400, not guessed here.
   */
  classCode?: string;
  /**
   * Optional explicit numeric student id for the ML service's
   * `student_id` field (e.g. from a student information system). If
   * omitted, a stable integer is derived from the profile's own string
   * id — student_id is not one of the trained model's feature columns,
   * so this never affects a prediction, only response identification.
   */
  externalStudentId?: number;

  // Bookkeeping
  profileCompleteness?: number; // 0-100, derived server-side
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted by POST /api/profile (id/timestamps assigned server-side). */
export type CreateStudentProfileInput = Omit<
  StudentProfile,
  "id" | "createdAt" | "updatedAt" | "profileCompleteness"
>;

/** Payload accepted by PATCH /api/profile/:id. */
export type UpdateStudentProfileInput =
  Partial<CreateStudentProfileInput>;

/** The subset of StudentProfile fields the ML service requires. */
export type MLRequiredFields = Required<
  Pick<
    StudentProfile,
    | "semester"
    | "extracurricularPoint"
    | "totalCredits"
    | "hasFailedCourse"
    | "classCode"
  >
>;
