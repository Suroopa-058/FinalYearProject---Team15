import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as savedService from "../services/saved.service";
import type { CreateSavedDto } from "../validators/request.schemas";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function postSaved(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateSavedDto;
  assertOwnProfile(req, body.userId);
  const saved = await savedService.saveScholarship(body);
  sendSuccess(res, saved, 201);
}

export async function listSaved(req: Request, res: Response): Promise<void> {
  assertOwnProfile(req, req.params.userId);
  const saved = await savedService.listSavedByUser(req.params.userId);
  sendSuccess(res, saved, 200, { count: saved.length });
}
