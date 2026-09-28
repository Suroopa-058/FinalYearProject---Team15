import type { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";
import * as authService from "../services/auth.service";
import type { LoginDto, RegisterStudentDto, RegisterUniversityDto } from "../validators/auth.schema";
export async function login(req: Request, res: Response) { sendSuccess(res, await authService.login(req.body as LoginDto)); }
export async function registerStudent(req: Request, res: Response) { sendSuccess(res, await authService.registerStudent(req.body as RegisterStudentDto), 201); }
export async function registerUniversity(req: Request, res: Response) { sendSuccess(res, await authService.registerUniversity(req.body as RegisterUniversityDto), 201); }
