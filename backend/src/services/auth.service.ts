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
  
  // Use a dummy hash to prevent timing attacks if email is not found
  const dummyHash = "$2a$12$R9h/lIPzMRFh41x7CmyJJuD.X9Zz.aOpCS.45y324213asdf";
  const isValid = await bcrypt.compare(input.password, user ? user.passwordHash : dummyHash);
  
  if (!user || !isValid) {
    throw new AppError("Invalid email or password", 401, "AUTH_INVALID");
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolName: user.schoolName,
      role: user.role
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

interface RegisterInput {
  email: string;
  password: any;
  name: string;
  schoolName: string;
}

export async function registerTeacher(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new AppError("Email is already registered", 400, "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    email,
    passwordHash,
    name: input.name,
    role: "teacher",
    schoolName: input.schoolName
  });

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolName: user.schoolName,
      role: user.role
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

