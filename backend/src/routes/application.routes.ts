import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import { createApplicationSchema } from "../validators/request.schemas";
import * as applicationController from "../controllers/application.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const applicationRouter = Router();

applicationRouter.post(
  "/applications",
  requireAuth,
  validate(createApplicationSchema),
  asyncHandler(applicationController.postApplication),
);

applicationRouter.get(
  "/applications/:userId",
  requireAuth,
  asyncHandler(applicationController.listApplications),
);
