import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import { recommendationRequestSchema } from "../validators/request.schemas";
import * as recommendationController from "../controllers/recommendation.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const recommendationRouter = Router();

recommendationRouter.post(
  "/recommendations",
  requireAuth,
  validate(recommendationRequestSchema),
  asyncHandler(recommendationController.postRecommendations),
);
