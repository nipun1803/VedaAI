import { Schema, model, type InferSchemaType, Types } from "mongoose";

const jobSchema = new Schema(
  {
    assignmentId: {
      type: Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },
    queueName: {
      type: String,
      enum: ["question-generation-queue", "pdf-generation-queue"],
      required: true,
      index: true
    },
    bullJobId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["queued", "active", "completed", "failed"],
      default: "queued",
      index: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    error: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

jobSchema.index({ assignmentId: 1, queueName: 1 });

export type JobDocument = InferSchemaType<typeof jobSchema>;
export const JobModel = model("Job", jobSchema);

