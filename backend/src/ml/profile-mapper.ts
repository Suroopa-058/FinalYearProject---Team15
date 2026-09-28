import type { StudentProfile } from "../models";
import { stableIntIdFromString } from "./stable-id";
import type { MlStudentProfileWire } from "./wire-types";
import { AppError } from "../utils/app-error";

const REQUIRED_ML_FIELDS = [
  "semester",
  "extracurricularPoint",
  "totalCredits",
  "hasFailedCourse",
  "classCode",
] as const;

/**
 * Maps a StudentProfile to the exact request shape the FastAPI service
 * expects (schemas.StudentProfile). Pure pass-through of already-supplied
 * fields — no values are invented. Throws a 400 naming exactly which
 * field(s) are missing if the profile hasn't been given the ML-specific
 * fields yet (note: `hasFailedCourse: false` is a valid, present value —
 * this checks for `undefined`, not falsiness).
 */
export function toMlStudentWire(profile: StudentProfile): MlStudentProfileWire {
  const missing = REQUIRED_ML_FIELDS.filter((field) => profile[field] === undefined);

  if (missing.length > 0) {
    throw new AppError(
      `This profile is missing the academic fields the ML service requires: ${missing.join(", ")}. ` +
        `Update it via PATCH /api/profile/${profile.id} first.`,
      400,
      "MISSING_ML_ACADEMIC_INPUT",
    );
  }

  return {
    student_id: profile.externalStudentId ?? stableIntIdFromString(profile.id),
    semester: profile.semester as 1 | 2,
    gpa: profile.gpa,
    extracurricular_point: profile.extracurricularPoint as number,
    total_credits: profile.totalCredits as number,
    class: profile.classCode as string,
    has_failed_course: profile.hasFailedCourse as boolean,
    student_year: profile.yearOfStudy,
  };
}