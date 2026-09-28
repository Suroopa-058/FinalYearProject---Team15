import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerStudentSchema, registerUniversitySchema } from "../validators/auth.schema";
import * as controller from "../controllers/auth.controller";
export const authRouter = Router();
authRouter.post("/auth/login", validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/auth/student/register", validate(registerStudentSchema), asyncHandler(controller.registerStudent));
authRouter.post("/auth/university/register", validate(registerUniversitySchema), asyncHandler(controller.registerUniversity));
