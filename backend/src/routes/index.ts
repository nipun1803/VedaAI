import { Router } from "express";
import { assignmentRouter } from "@/routes/assignment.routes.js";
import { authRouter } from "@/routes/auth.routes.js";
import { healthRouter } from "@/routes/health.routes.js";
import { uploadRoutes } from "@/routes/upload.routes.js";
import { jobsRouter } from "@/routes/jobs.routes.js";
import { groupRouter } from "@/routes/group.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/assignments", assignmentRouter);
apiRouter.use("/groups", groupRouter);
apiRouter.use("/upload", uploadRoutes);
apiRouter.use("/jobs", jobsRouter);
