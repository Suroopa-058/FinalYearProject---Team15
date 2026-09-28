import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { getHealth } from "../controllers/health.controller";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(getHealth));
