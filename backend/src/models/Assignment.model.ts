import { Schema, model, type InferSchemaType } from "mongoose";

const questionConfigSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["MCQ", "Short Answer", "Long Answer", "True/False"],
      required: true
    },
    count: {
      type: Number,
      min: 1,
      max: 50,
      required: true
    },
    marks: {
      type: Number,
      min: 1,
      max: 25,
      required: true
    }
  },
  { _id: false }
);

const difficultyDistributionSchema = new Schema(
  {
    easy: { type: Number, min: 0, max: 100, required: true },
    medium: { type: Number, min: 0, max: 100, required: true },
    hard: { type: Number, min: 0, max: 100, required: true }
  },
  { _id: false }
);

const assignmentSchema = new Schema(
  {
    teacherId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: "text"
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    fileName: {
      type: String,
      trim: true
    },
    fileContext: {
      type: String
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    questionConfigs: {
      type: [questionConfigSchema],
      required: true,
      validate: [(value: unknown[]) => value.length > 0, "At least one question type is required"]
    },
    difficultyDistribution: {
      type: difficultyDistributionSchema,
      required: true
    },
    instructions: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["draft", "queued", "generating", "completed", "failed"],
      default: "queued",
      index: true
    },
    lastError: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

assignmentSchema.index({ teacherId: 1, createdAt: -1 });
assignmentSchema.index({ teacherId: 1, status: 1 });

export type AssignmentDocument = InferSchemaType<typeof assignmentSchema>;
export const AssignmentModel = model("Assignment", assignmentSchema);

