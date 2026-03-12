import { Schema, model } from "mongoose";

export type UserRole = "doctor" | "receptionist";

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  specialization?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["doctor", "receptionist"], required: true },
    specialization: { type: String, trim: true }
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", userSchema);
