import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { JobModel } from "@/models/Job.model.js";
import { AppError } from "@/utils/AppError.js";
import { AssignmentModel } from "@/models/Assignment.model.js";
import { requireAuth } from "@/middlewares/auth.js";

const router = Router();

router.get(
  "/assignments/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const assignmentId = req.params.id;
    if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    const assignment = await AssignmentModel.findOne({ _id: assignmentId, teacherId: req.user.id });
    if (!assignment) {
      throw new AppError("Assignment not found", 404, "NOT_FOUND");
    }

    const job = await JobModel.findOne({ assignmentId }).sort({ createdAt: -1 });

    if (!job) {
      return res.json({
        success: true,
        data: {
          status: assignment.status,
          progress: assignment.status === "completed" ? 100 : 0,
          message: assignment.status === "completed" ? "Completed" : "Queued",
          stage: assignment.status === "completed" ? "completed" : "queued"
        }
      });
    }

    let stage = "queued";
    if (job.status === "active") stage = job.progress >= 82 ? "pdf-generation" : job.progress >= 58 ? "ai-processing" : "started";
    if (job.status === "completed") stage = "completed";
    if (job.status === "failed") stage = "failed";

    res.json({
      success: true,
      data: {
        status: job.status,
        progress: job.progress || 0,
        message: job.error ? job.error : (job.status === "completed" ? "Job completed" : "Processing"),
        stage
      }
    });
  })
);

export const jobsRouter = router;
