import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import { UserModel } from "@/models/User.model.js";
import { AppError } from "@/utils/AppError.js";

interface LoginInput {
  email: string;
  password: string;
}

export async function ensureDemoUser() {
  const existing = await UserModel.findOne({ email: env.DEMO_EMAIL });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.DEMO_PASSWORD, 12);
  return UserModel.create({
    email: env.DEMO_EMAIL,
    passwordHash,
    name: env.DEMO_NAME,
    role: "teacher",
    schoolName: env.DEMO_SCHOOL
  });
}

export async function loginTeacher(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new AppError("Invalid email or password", 401, "AUTH_INVALID");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401, "AUTH_INVALID");
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolName: user.schoolName
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolName: user.schoolName,
      role: user.role
    },
    token
  };
}
