import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as universityService from "../services/university.service";
import type { CreateUniversityScholarshipDto } from "../validators/auth.schema";
const universityId = (req: Request) => req.auth!.universityId!;
export async function requestVerification(req: Request, res: Response) { sendSuccess(res, await universityService.requestVerification(universityId(req))); }
export async function createScholarship(req: Request, res: Response) { sendSuccess(res, await universityService.createScholarship(universityId(req), req.body as CreateUniversityScholarshipDto), 201); }
export async function listScholarships(req: Request, res: Response) { const data = await universityService.listScholarships(universityId(req)); sendSuccess(res, data, 200, { count: data.length }); }
export async function updateScholarship(req: Request, res: Response) { sendSuccess(res, await universityService.updateScholarship(universityId(req), req.params.id, req.body)); }
export async function roster(req: Request, res: Response) { const data = await universityService.roster(universityId(req)); sendSuccess(res, data, 200, { count: data.length }); }
export async function applications(req: Request, res: Response) { const data = await universityService.applications(universityId(req)); sendSuccess(res, data, 200, { count: data.length }); }
