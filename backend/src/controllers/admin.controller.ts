import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import { getPlatformAdminOverview } from "../services/admin.service";
import { universityRepository } from "../data/repositories/university.repository";

export async function overview(req: Request, res: Response) {
  const overview = await getPlatformAdminOverview();
  sendSuccess(res, overview);
}

export async function universities(req: Request, res: Response) {
  const universities = await universityRepository.getAll();
  sendSuccess(res, universities);
}
