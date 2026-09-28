import { z } from "zod";

export const createApplicationSchema = z.object({
  userId: z.string().min(1),
  scholarshipId: z.string().min(1),
  submittedDocuments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const createSavedSchema = z.object({
  userId: z.string().min(1),
  scholarshipId: z.string().min(1),
});

/** Body for POST /api/recommendations and POST /api/eligibility. */
export const profileIdOrInlineProfileSchema = z.union([
  z.object({ profileId: z.string().min(1) }),
  z.object({ profile: z.record(z.unknown()) }), // validated more strictly downstream if needed
]);

export const eligibilityRequestSchema = z.object({
  profileId: z.string().min(1),
  scholarshipId: z.string().min(1),
});

export const recommendationRequestSchema = z.object({
  profileId: z.string().min(1),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
export type CreateSavedDto = z.infer<typeof createSavedSchema>;
export type EligibilityRequestDto = z.infer<typeof eligibilityRequestSchema>;
export type RecommendationRequestDto = z.infer<typeof recommendationRequestSchema>;
