import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as scholarshipController from "../controllers/scholarship.controller";

export const scholarshipRouter = Router();

scholarshipRouter.get("/scholarships", asyncHandler(scholarshipController.listScholarships));
scholarshipRouter.get("/scholarships/:id", asyncHandler(scholarshipController.getScholarship));
