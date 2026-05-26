import { Schema, model, type InferSchemaType, Types } from "mongoose";

const aiLogSchema = new Schema(
  {
    assignmentId: {
      type: Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },
    model: {
      type: String,
      required: true,
      index: true
    },
    prompt: {
      type: String,
      required: true
    },
    rawResponse: {
      type: String
    },
    parsedOutput: {
      type: Schema.Types.Mixed
    },
    tokenUsage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number
    },
    latencyMs: {
      type: Number
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      index: true
    },
    error: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export type AiLogDocument = InferSchemaType<typeof aiLogSchema>;
export const AiLogModel = model("AiLog", aiLogSchema);

