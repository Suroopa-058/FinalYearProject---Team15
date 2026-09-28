import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { requireAuth, requireRoles } from "../middleware/auth.middleware";
import * as controller from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use("/admin", requireAuth, requireRoles("platform_admin"));
adminRouter.get("/admin/overview", asyncHandler(controller.overview));
adminRouter.get("/admin/universities", asyncHandler(controller.universities));
