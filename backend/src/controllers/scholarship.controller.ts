import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as scholarshipService from "../services/scholarship.service";

export async function listScholarships(req: Request, res: Response): Promise<void> {
  const scholarships = await scholarshipService.listScholarships();
  sendSuccess(res, scholarships, 200, { count: scholarships.length });
}

export async function getScholarship(req: Request, res: Response): Promise<void> {
  const scholarship = await scholarshipService.getScholarshipById(req.params.id);
  sendSuccess(res, scholarship);
}
