import { Types } from "mongoose";
import { AssignmentModel } from "@/models/Assignment.model.js";
import { GeneratedPaperModel } from "@/models/GeneratedPaper.model.js";
import { enqueueQuestionGeneration } from "@/queues/generation.queue.js";
import { AppError } from "@/utils/AppError.js";
import {
  getCachedAssignment,
  setCachedAssignment,
  getCachedAssignmentList,
  setCachedAssignmentList,
  invalidateAssignment,
  invalidatePaper,
  invalidateTeacherAssignments
} from "@/services/cache.service.js";
import type { AssignmentBody } from "@/validators/assignment.validator.js";

interface TeacherContext {
  id: string;
  schoolName: string;
}

export async function createAssignmentForTeacher(input: AssignmentBody, teacher: TeacherContext) {
  const assignment = await AssignmentModel.create({
    ...input,
    teacherId: teacher.id,
    dueDate: new Date(input.dueDate),
    status: "queued"
  });

  await invalidateTeacherAssignments(teacher.id);

  await enqueueQuestionGeneration({
    assignmentId: assignment._id.toString(),
    teacherId: teacher.id,
    schoolName: teacher.schoolName
  });

  return assignment;
}

export async function listAssignmentsForTeacher(teacherId: string, limit = 20, page = 1) {
  const cacheKey = `${teacherId}:limit:${limit}:page:${page}`;
  const cached = await getCachedAssignmentList<any[]>(cacheKey);
  if (cached) {
    return cached.map((item) => AssignmentModel.hydrate(item));
  }

  const skip = (page - 1) * limit;
  const assignments = await AssignmentModel.find({ teacherId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  await setCachedAssignmentList(cacheKey, assignments.map((a) => a.toObject()));

  return assignments;
}

export async function getAssignmentForTeacher(assignmentId: string, teacherId: string) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new AppError("Invalid assignment id", 400, "INVALID_ASSIGNMENT_ID");
  }

  const cached = await getCachedAssignment<any>(assignmentId);
  if (cached) {
    return AssignmentModel.hydrate(cached);
  }

  const assignment = await AssignmentModel.findOne({ _id: assignmentId, teacherId });
  if (!assignment) {
    throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  }

  await setCachedAssignment(assignmentId, assignment.toObject());

  return assignment;
}

export async function regenerateAssignmentForTeacher(
  assignmentId: string,
  teacher: TeacherContext
) {
  const assignment = await getAssignmentForTeacher(assignmentId, teacher.id);

  assignment.status = "queued";
  assignment.lastError = undefined;
  await assignment.save();

  await GeneratedPaperModel.deleteOne({ assignmentId: assignment._id, teacherId: teacher.id });

  await invalidateAssignment(assignmentId);
  await invalidatePaper(assignmentId);
  await invalidateTeacherAssignments(teacher.id);

  await enqueueQuestionGeneration({
    assignmentId: assignment._id.toString(),
    teacherId: teacher.id,
    schoolName: teacher.schoolName
  });

  return assignment;
}
