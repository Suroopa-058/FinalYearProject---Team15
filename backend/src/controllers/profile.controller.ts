import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as profileService from "../services/profile.service";
import type { CreateStudentProfileDto } from "../validators/student-profile.schema";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function createProfile(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateStudentProfileDto;
  const profile = await profileService.createProfile(body);
  sendSuccess(res, profile, 201);
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  assertOwnProfile(req, req.params.id);
  const profile = await profileService.getProfileById(req.params.id);
  sendSuccess(res, profile);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  assertOwnProfile(req, req.params.id);
  const profile = await profileService.updateProfile(req.params.id, req.body);
  sendSuccess(res, profile);
}
