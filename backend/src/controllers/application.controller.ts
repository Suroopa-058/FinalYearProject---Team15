import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as applicationService from "../services/application.service";
import type { CreateApplicationDto } from "../validators/request.schemas";
import { assertOwnProfile } from "../middleware/auth.middleware";

export async function postApplication(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateApplicationDto;
  assertOwnProfile(req, body.userId);
  const application = await applicationService.createApplication(body);
  sendSuccess(res, application, 201);
}

export async function listApplications(req: Request, res: Response): Promise<void> {
  assertOwnProfile(req, req.params.userId);
  const applications = await applicationService.listApplicationsByUser(req.params.userId);
  sendSuccess(res, applications, 200, { count: applications.length });
}
