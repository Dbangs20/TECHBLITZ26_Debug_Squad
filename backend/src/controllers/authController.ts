import type { Request, Response } from "express";
import { z } from "zod";

import { UserModel } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../utils/http.js";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["doctor", "receptionist"]),
  specialization: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function signup(request: Request, response: Response) {
  const payload = signupSchema.parse(request.body);
  const existingUser = await UserModel.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError(409, "A user with this email already exists");
  }

  const user = await UserModel.create({
    ...payload,
    password: await hashPassword(payload.password)
  });

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email
  });

  response.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization
    }
  });
}

export async function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const user = await UserModel.findOne({ email: payload.email });

  if (!user || !(await comparePassword(payload.password, user.password))) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email
  });

  response.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization
    }
  });
}
