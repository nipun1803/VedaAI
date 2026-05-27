import type { Request, Response } from "express";
import {
  createAssignmentForTeacher,
  getAssignmentForTeacher,
  listAssignmentsForTeacher,
  regenerateAssignmentForTeacher
} from "@/services/assignment.service.js";
import { getPaperForTeacher } from "@/services/generatedPaper.service.js";
import { generatePdfForPaper } from "@/services/pdf.service.js";
import { AppError } from "@/utils/AppError.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await createAssignmentForTeacher(req.body, getTeacher(req));
  res.status(201).json({
    success: true,
    data: {
      assignment: serializeAssignment(assignment)
    }
  });
});

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100) : 20;
  const page = req.query.page ? Math.max(parseInt(req.query.page as string) || 1, 1) : 1;

  const assignments = await listAssignmentsForTeacher(getTeacher(req).id, limit, page);
  res.json({
    success: true,
    data: {
      assignments: assignments.map(serializeAssignment)
    }
  });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacher = getTeacher(req);
  const id = req.params.id as string;
  const assignment = await getAssignmentForTeacher(id, teacher.id);
  const paper = await getPaperForTeacher(id, teacher.id);

  res.json({
    success: true,
    data: {
      assignment: serializeAssignment(assignment),
      paper: paper ? serializePaper(paper) : null
    }
  });
});

export const regenerateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await regenerateAssignmentForTeacher(req.params.id as string, getTeacher(req));
  res.json({
    success: true,
    data: {
      assignment: serializeAssignment(assignment)
    }
  });
});

export const downloadAssignmentPdf = asyncHandler(async (req: Request, res: Response) => {
  const teacher = getTeacher(req);
  const id = req.params.id as string;
  await getAssignmentForTeacher(id, teacher.id);
  const paper = await getPaperForTeacher(id, teacher.id);

  if (!paper) {
    throw new AppError("Generated paper not found", 404, "PAPER_NOT_FOUND");
  }

  const buffer = paper.pdfBuffer ?? (await generatePdfForPaper(paper));
  const fileName =
    paper.pdfFileName ?? `${paper.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-question-paper.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(buffer);
});

function getTeacher(req: Request) {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return {
    id: req.user.id,
    schoolName: req.user.schoolName
  };
}

function serializeAssignment(assignment: { _id: unknown; toObject: () => Record<string, unknown> }) {
  const object = assignment.toObject();
  return {
    ...object,
    id: String(assignment._id),
    _id: undefined,
    __v: undefined
  };
}

function serializePaper(paper: { _id: unknown; toObject: () => Record<string, unknown> }) {
  const object = paper.toObject();
  return {
    ...object,
    id: String(paper._id),
    assignmentId: String(object.assignmentId),
    generatedAt: object.createdAt,
    _id: undefined,
    __v: undefined,
    pdfBuffer: undefined
  };
}
