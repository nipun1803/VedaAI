import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        mongoId?: Types.ObjectId;
        email: string;
        name: string;
        schoolName: string;
        role: string;
      };
    }
  }
}

export {};

