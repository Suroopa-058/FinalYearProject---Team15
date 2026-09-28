import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import { eligibilityRequestSchema } from "../validators/request.schemas";
import * as eligibilityController from "../controllers/eligibility.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const eligibilityRouter = Router();

eligibilityRouter.post(
  "/eligibility",
  requireAuth,
  validate(eligibilityRequestSchema),
  asyncHandler(eligibilityController.postEligibility),
);
