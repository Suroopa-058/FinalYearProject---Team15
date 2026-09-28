import type { CreateStudentProfileInput, StudentProfile, UpdateStudentProfileInput } from "../models";
import { profileRepository } from "../data/repositories/profile.repository";
import { generateId } from "../utils/id-generator";
import { NotFoundError } from "../utils/app-error";

/** Fields we consider when scoring how "complete" a profile is (0-100). */
const COMPLETENESS_FIELDS: (keyof StudentProfile)[] = [
  "fullName",
  "email",
  "phone",
  "dob",
  "gender",
  "degree",
  "institutionId",
  "legacyInstitutionName",
  "yearOfStudy",
  "gpa",
  "fieldOfStudy",
  "category",
  "incomeBracket",
  "interests",
  "achievements",
];

function calculateCompleteness(profile: Partial<StudentProfile>): number {
  const filled = COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  }).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

export async function createProfile(input: CreateStudentProfileInput): Promise<StudentProfile> {
  const now = new Date().toISOString();
  const profile: StudentProfile = {
    ...input,
    id: generateId("profile"),
    createdAt: now,
    updatedAt: now,
  };
  profile.profileCompleteness = calculateCompleteness(profile);
  return profileRepository.create(profile);
}

export async function getProfileById(id: string): Promise<StudentProfile> {
  const profile = await profileRepository.getById(id);
  if (!profile) throw new NotFoundError("StudentProfile", id);
  return profile;
}

export async function updateProfile(
  id: string,
  patch: UpdateStudentProfileInput,
): Promise<StudentProfile> {
  // getProfileById 404s if the id doesn't exist. `patch` here is already
  // the Zod-parsed body (see validate.middleware.ts / profile.routes.ts),
  // so every key present in it — including the flat ML fields
  // (semester, extracurricularPoint, totalCredits, hasFailedCourse,
  // classCode) — is a real, validated field on StudentProfile and a
  // plain object spread is enough to persist it. No nested-object
  // merging or field-stripping happens here.
  const existing = await getProfileById(id);
  const merged: StudentProfile = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  merged.profileCompleteness = calculateCompleteness(merged);
  const updated = await profileRepository.update(id, merged);
  if (!updated) throw new NotFoundError("StudentProfile", id);
  return updated;
}
