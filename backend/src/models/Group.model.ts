import { Schema, model, type InferSchemaType, Types } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    studentsCount: {
      type: Number,
      default: 0
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export type GroupDocument = InferSchemaType<typeof groupSchema> & { _id: Types.ObjectId };
export const GroupModel = model("Group", groupSchema);
