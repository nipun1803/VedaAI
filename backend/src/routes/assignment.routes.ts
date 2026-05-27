import { Router } from "express";
import {
  createAssignment,
  downloadAssignmentPdf,
  getAssignment,
  listAssignments,
  regenerateAssignment
} from "@/controllers/assignment.controller.js";
import { requireAuth } from "@/middlewares/auth.js";
import { validateBody } from "@/middlewares/validateRequest.js";
import { assignmentBodySchema } from "@/validators/assignment.validator.js";

export const assignmentRouter = Router();

assignmentRouter.use(requireAuth);
assignmentRouter.post("/", validateBody(assignmentBodySchema), createAssignment);
assignmentRouter.get("/", listAssignments);
assignmentRouter.get("/:id", getAssignment);
assignmentRouter.post("/:id/regenerate", regenerateAssignment);
assignmentRouter.get("/:id/pdf", downloadAssignmentPdf);

