import { Router } from "express";
import {
  createGroup,
  deleteGroup,
  listGroups,
  toggleGroupArchive
} from "@/controllers/group.controller.js";
import { requireAuth } from "@/middlewares/auth.js";
import { validateBody } from "@/middlewares/validateRequest.js";
import { groupBodySchema } from "@/validators/group.validator.js";

export const groupRouter = Router();

groupRouter.use(requireAuth);
groupRouter.get("/", listGroups);
groupRouter.post("/", validateBody(groupBodySchema), createGroup);
groupRouter.post("/:id/toggle-archive", toggleGroupArchive);
groupRouter.delete("/:id", deleteGroup);
