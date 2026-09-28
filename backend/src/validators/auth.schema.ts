import { z } from "zod";
import { incomeBracketSchema } from "./student-profile.schema";

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const registerStudentSchema = z.object({
  email: z.string().email(), password: z.string().min(8), fullName: z.string().min(2),
  phone: z.string().min(7).optional(), dob: z.string().date(), gender: z.enum(["female", "male", "non-binary"]),
  degree: z.string().min(2).optional(), institutionId: z.string().min(1).optional(), legacyInstitutionName: z.string().min(1).optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(6), gpa: z.coerce.number().min(0).max(10),
  category: z.string().optional(), incomeBracket: incomeBracketSchema.optional(),
  externalStudentId: z.coerce.number().int().positive().optional(),
  semester: z.union([z.literal(1), z.literal(2)]),
  extracurricularPoint: z.coerce.number().min(0).max(100),
  totalCredits: z.coerce.number().int().min(0),
  hasFailedCourse: z.boolean(),
  classCode: z.string().min(1),
});
export const registerUniversitySchema = z.object({
  name: z.string().min(2),
  verifiedEmailDomain: z.string().min(3).transform((value) => value.replace(/^@/, "").toLowerCase()),
  address: z.string().min(5),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
export const createUniversityScholarshipSchema = z.object({
  name: z.string().min(2), provider: z.string().min(2), country: z.string().min(2),
  amount: z.coerce.number().nonnegative(), currency: z.string().min(1), category: z.string().min(2),
  tags: z.array(z.string()).default([]), description: z.string().min(10), requirements: z.array(z.string()).default([]),
  eligibilityCriteria: z.record(z.unknown()).default({}), deadline: z.string().date(), renewable: z.boolean().default(false),
  status: z.enum(["draft", "pending_review"]).default("draft"),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterStudentDto = z.infer<typeof registerStudentSchema>;
export type RegisterUniversityDto = z.infer<typeof registerUniversitySchema>;
export type CreateUniversityScholarshipDto = z.infer<typeof createUniversityScholarshipSchema>;
