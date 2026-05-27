import { Types } from "mongoose";
import type { AssignmentDocument } from "@/models/Assignment.model.js";
import { GeneratedPaperModel } from "@/models/GeneratedPaper.model.js";
import type { GeneratedPaperPayload, GeneratedQuestion, QuestionType } from "@/types/assessment.js";
import { AppError } from "@/utils/AppError.js";
import { getCachedPaper, setCachedPaper, invalidatePaper } from "@/services/cache.service.js";

export function validateGeneratedPaperAgainstAssignment(
  assignment: AssignmentDocument & { _id: Types.ObjectId },
  payload: GeneratedPaperPayload
) {
  const allQuestions = payload.sections.flatMap((section) => section.questions);

  assignment.questionConfigs.forEach((config) => {
    const matching = allQuestions.filter((question) => question.type === config.type);
    if (matching.length !== config.count) {
      throw new AppError(
        `AI generated ${matching.length} ${config.type} questions; expected ${config.count}`,
        502,
        "AI_COUNT_MISMATCH"
      );
    }

    const invalidMarks = matching.find((question) => question.marks !== config.marks);
    if (invalidMarks) {
      throw new AppError(
        `AI generated invalid marks for ${config.type}; expected ${config.marks}`,
        502,
        "AI_MARKS_MISMATCH"
      );
    }
  });

  const invalidMcq = allQuestions.find(
    (question) => question.type === "MCQ" && (!question.options || question.options.length !== 4)
  );
  if (invalidMcq) {
    throw new AppError("AI generated an MCQ without exactly four options", 502, "AI_MCQ_INVALID");
  }
}

export async function upsertGeneratedPaper(
  assignment: AssignmentDocument & { _id: Types.ObjectId },
  payload: GeneratedPaperPayload,
  schoolName: string
) {
  validateGeneratedPaperAgainstAssignment(assignment, payload);

  const maximumMarks = payload.sections.reduce(
    (sum, section) => sum + section.questions.reduce((sectionSum, question) => sectionSum + question.marks, 0),
    0
  );

  const answerKey = payload.sections.flatMap((section) =>
    section.questions.map((question, index) => buildAnswerKeyLine(index + 1, question))
  );

  const paper = await GeneratedPaperModel.findOneAndUpdate(
    { assignmentId: assignment._id },
    {
      assignmentId: assignment._id,
      teacherId: assignment.teacherId,
      title: payload.title || assignment.title,
      schoolName,
      subject: assignment.subject,
      grade: assignment.grade,
      timeAllowed: maximumMarks > 50 ? "90 minutes" : "45 minutes",
      maximumMarks,
      sections: payload.sections,
      answerKey
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  if (!paper) {
    throw new AppError("Generated paper could not be saved", 500, "PAPER_SAVE_FAILED");
  }

  await invalidatePaper(assignment._id.toString());

  return paper;
}

export async function getPaperForTeacher(assignmentId: string, teacherId: string) {
  if (!Types.ObjectId.isValid(assignmentId)) {
    throw new AppError("Invalid assignment id", 400, "INVALID_ASSIGNMENT_ID");
  }

  const cached = await getCachedPaper<any>(assignmentId);
  if (cached) {
    return GeneratedPaperModel.hydrate(cached);
  }

  const paper = await GeneratedPaperModel.findOne({
    assignmentId,
    teacherId
  });

  if (paper) {
    await setCachedPaper(assignmentId, paper.toObject());
  }

  return paper;
}

function buildAnswerKeyLine(index: number, question: GeneratedQuestion) {
  return `${index}. ${question.answer ?? fallbackAnswer(question.type)}`;
}

function fallbackAnswer(type: QuestionType) {
  if (type === "MCQ") return "Correct option as generated.";
  if (type === "True/False") return "True or False as applicable.";
  return "Answer should include relevant concepts, reasoning, and examples.";
}
