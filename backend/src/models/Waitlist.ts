import { Schema, model, type Types } from "mongoose";

export interface WaitlistDocument {
  _id: string;
  patientName: string;
  doctorId: Types.ObjectId | string;
  preferredDate: string;
  appointmentType: "consultation" | "follow-up" | "emergency";
  urgency: number;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<WaitlistDocument>(
  {
    patientName: { type: String, required: true, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    preferredDate: { type: String, required: true },
    appointmentType: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
      required: true
    },
    urgency: { type: Number, default: 1 }
  },
  { timestamps: true }
);

waitlistSchema.index({ doctorId: 1, preferredDate: 1, urgency: -1, createdAt: 1 });

export const WaitlistModel = model<WaitlistDocument>("Waitlist", waitlistSchema);
