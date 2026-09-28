import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as explainController from "../controllers/explain.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const explainRouter = Router();

// Bonus beyond the original spec — reuses the ML service's SHAP-based
// explainability (fastapi_integration/explain.py) for one profile +
// scholarship pair.
explainRouter.post("/explain", requireAuth, asyncHandler(explainController.postExplain));
