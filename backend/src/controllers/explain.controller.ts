import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import { explainRecommendation } from "../services/explain.service";
import { ValidationError } from "../utils/app-error";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function postExplain(req: Request, res: Response): Promise<void> {
  const { profileId, scholarshipId } = req.body as { profileId?: string; scholarshipId?: string };
  if (!profileId || !scholarshipId) {
    throw new ValidationError({
      profileId: profileId ? [] : ["profileId is required"],
      scholarshipId: scholarshipId ? [] : ["scholarshipId is required"],
    });
  }
  assertOwnProfile(req, profileId);
  const result = await explainRecommendation(profileId, scholarshipId);
  sendSuccess(res, result);
}
