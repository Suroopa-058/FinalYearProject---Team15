import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import { checkEligibility } from "../services/eligibility.service";
import type { EligibilityRequestDto } from "../validators/request.schemas";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function postEligibility(req: Request, res: Response): Promise<void> {
  const { profileId, scholarshipId } = req.body as EligibilityRequestDto;
    assertOwnProfile(req, profileId);
      const result = await checkEligibility(profileId, scholarshipId);
        sendSuccess(res, result);
        }
        