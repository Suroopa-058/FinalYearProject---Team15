import { z } from "zod";

export const genderSchema = z.enum([
  "female",
  "male",
  "non-binary",
  "prefer-not-to-say",
  "other",
]);

export const incomeBracketSchema = z.enum([
  "below-2lpa",
  "2-5lpa",
  "5-10lpa",
  "above-10lpa",
  "prefer-not-to-say",
]);

export const createStudentProfileSchema = z.object({
  fullName: z.string().min(2, "fullName must be at least 2 characters"),
  email: z.string().email("email must be a valid email address"),
  phone: z.string().min(7).optional(),
  dob: z.string().date().optional().or(z.literal("").transform(() => undefined)),
  gender: genderSchema.optional(),

  degree: z.string().min(2).optional(),
  institutionId: z.string().min(1).optional(),
  legacyInstitutionName: z.string().min(1).optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(6),
  gpa: z.coerce.number().min(0).max(10),
  fieldOfStudy: z.string().optional(),

  category: z.string().optional(),
  incomeBracket: incomeBracketSchema.optional(),
  isFirstGeneration: z.boolean().optional(),
  ruralBackground: z.boolean().optional(),

  interests: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),

  /**
   * ── ML service fields ──
   * Flat, top-level, individually optional — matching exactly how
   * PATCH /api/profile/:id and POST /api/profile actually receive them
   * (see backend/src/models/student-profile.model.ts for why these are
   * flat rather than nested under an "mlAcademicInput" key: a Zod
   * object schema silently drops any key it doesn't declare, so a
   * previous nested-only schema caused these fields to vanish on every
   * PATCH even though the request returned success:true).
   */
  externalStudentId: z.coerce.number().int().positive().optional(),
  semester: z.union([z.literal(1), z.literal(2)]).optional(),
  extracurricularPoint: z.coerce.number().min(0).max(100).optional(),
  totalCredits: z.coerce.number().int().min(0).optional(),
  hasFailedCourse: z.boolean().optional(),
  classCode: z.string().min(1, "classCode is required, e.g. \"CS2021\" or \"CSE\"").optional(),
});

export const updateStudentProfileSchema = createStudentProfileSchema.partial();

export type CreateStudentProfileDto = z.infer<typeof createStudentProfileSchema>;
export type UpdateStudentProfileDto = z.infer<typeof updateStudentProfileSchema>;
