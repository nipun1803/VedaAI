import { Schema, model, type InferSchemaType, Types } from "mongoose";

const questionSchema = new Schema(
  {
    question: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    marks: { type: Number, min: 1, required: true },
    type: { type: String, enum: ["MCQ", "Short Answer", "Long Answer", "True/False"], required: true },
    options: [{ type: String }],
    answer: { type: String }
  },
  { _id: false }
);

const sectionSchema = new Schema(
  {
    name: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: {
      type: [questionSchema],
      required: true,
      validate: [(value: unknown[]) => value.length > 0, "Section must include questions"]
    }
  },
  { _id: false }
);

const generatedPaperSchema = new Schema(
  {
    assignmentId: {
      type: Types.ObjectId,
      ref: "Assignment",
      required: true,
      unique: true,
      index: true
    },
    teacherId: {
      type: String,
      required: true,
      index: true
    },
    title: { type: String, required: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    timeAllowed: { type: String, required: true },
    maximumMarks: { type: Number, min: 1, required: true },
    sections: {
      type: [sectionSchema],
      required: true,
      validate: [(value: unknown[]) => value.length > 0, "Paper must include sections"]
    },
    answerKey: [{ type: String }],
    pdfBuffer: { type: Buffer },
    pdfFileName: { type: String }
  },
  {
    timestamps: true
  }
);

generatedPaperSchema.index({ teacherId: 1, createdAt: -1 });

export type GeneratedPaperDocument = InferSchemaType<typeof generatedPaperSchema>;
export const GeneratedPaperModel = model("GeneratedPaper", generatedPaperSchema);

