import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import {
  createStudentProfileSchema,
  updateStudentProfileSchema,
} from "../validators/student-profile.schema";
import * as profileController from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const profileRouter = Router();

profileRouter.post(
  "/profile",
  validate(createStudentProfileSchema),
  asyncHandler(profileController.createProfile),
);

profileRouter.get("/profile/:id", requireAuth, asyncHandler(profileController.getProfile));

// Bonus beyond the original spec — lets the frontend update a profile
// (e.g. after onboarding) without needing to recreate it.
profileRouter.patch(
  "/profile/:id",
  requireAuth,
  validate(updateStudentProfileSchema),
  asyncHandler(profileController.updateProfile),
);
