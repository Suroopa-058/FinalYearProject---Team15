import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import { recommendScholarships } from "../services/recommendation.service";
import type { RecommendationRequestDto } from "../validators/request.schemas";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function postRecommendations(req: Request, res: Response): Promise<void> {
  const { profileId } = req.body as RecommendationRequestDto;
  assertOwnProfile(req, profileId);
  const result = await recommendScholarships(profileId);
  sendSuccess(res, result);
}
