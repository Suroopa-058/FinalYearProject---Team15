import { Router } from "express";
import { healthRouter } from "./health.routes";
import { scholarshipRouter } from "./scholarship.routes";
import { profileRouter } from "./profile.routes";
import { recommendationRouter } from "./recommendation.routes";
import { eligibilityRouter } from "./eligibility.routes";
import { applicationRouter } from "./application.routes";
import { savedRouter } from "./saved.routes";
import { explainRouter } from "./explain.routes";
import { authRouter } from "./auth.routes";
import { universityRouter } from "./university.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(scholarshipRouter);
apiRouter.use(profileRouter);
apiRouter.use(recommendationRouter);
apiRouter.use(eligibilityRouter);
apiRouter.use(applicationRouter);
apiRouter.use(savedRouter);
apiRouter.use(explainRouter);
apiRouter.use(authRouter);
apiRouter.use(universityRouter);
apiRouter.use(adminRouter);
