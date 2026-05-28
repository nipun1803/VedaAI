import type { Request, Response } from "express";
import { GroupModel } from "@/models/Group.model.js";
import { AppError } from "@/utils/AppError.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { Types } from "mongoose";
import {
  getCachedGroupList,
  setCachedGroupList,
  invalidateTeacherGroups
} from "@/services/cache.service.js";

export const listGroups = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getTeacherId(req);
  const isArchived = req.query.archived === "true";

  // Try checking Redis cache first
  const cached = await getCachedGroupList<any[]>(teacherId, isArchived);
  if (cached) {
    res.json({
      success: true,
      data: {
        groups: cached
      }
    });
    return;
  }

  const groups = await GroupModel.find({
    teacherId: new Types.ObjectId(teacherId),
    isArchived
  }).sort({ createdAt: -1 });

  const serialized = groups.map(serializeGroup);

  // Set Redis cache list
  await setCachedGroupList(teacherId, isArchived, serialized);

  res.json({
    success: true,
    data: {
      groups: serialized
    }
  });
});

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getTeacherId(req);
  const { name, studentsCount } = req.body;

  const group = await GroupModel.create({
    name,
    studentsCount: studentsCount ?? 0,
    teacherId: new Types.ObjectId(teacherId),
    isArchived: false
  });

  // Active invalidation of group list cache
  await invalidateTeacherGroups(teacherId);

  res.status(201).json({
    success: true,
    data: {
      group: serializeGroup(group)
    }
  });
});

export const toggleGroupArchive = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getTeacherId(req);
  const id = req.params.id as string;

  const group = await GroupModel.findOne({
    _id: new Types.ObjectId(id),
    teacherId: new Types.ObjectId(teacherId)
  });

  if (!group) {
    throw new AppError("Student group not found", 404, "GROUP_NOT_FOUND");
  }

  group.isArchived = !group.isArchived;
  await group.save();

  // Active invalidation of group list cache
  await invalidateTeacherGroups(teacherId);

  res.json({
    success: true,
    data: {
      group: serializeGroup(group)
    }
  });
});

export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getTeacherId(req);
  const id = req.params.id as string;

  const group = await GroupModel.findOneAndDelete({
    _id: new Types.ObjectId(id),
    teacherId: new Types.ObjectId(teacherId)
  });

  if (!group) {
    throw new AppError("Student group not found", 404, "GROUP_NOT_FOUND");
  }

  // Active invalidation of group list cache
  await invalidateTeacherGroups(teacherId);

  res.json({
    success: true,
    data: {
      success: true,
      message: "Group successfully deleted"
    }
  });
});

function getTeacherId(req: Request): string {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }
  return req.user.id;
}

function serializeGroup(group: any) {
  const object = group.toObject();
  return {
    ...object,
    id: String(group._id),
    _id: undefined,
    __v: undefined,
    teacherId: String(object.teacherId)
  };
}
