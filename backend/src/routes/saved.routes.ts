import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { validate } from "../middleware/validate.middleware";
import { createSavedSchema } from "../validators/request.schemas";
import * as savedController from "../controllers/saved.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const savedRouter = Router();

savedRouter.post("/saved", requireAuth, validate(createSavedSchema), asyncHandler(savedController.postSaved));

savedRouter.get("/saved/:userId", requireAuth, asyncHandler(savedController.listSaved));
