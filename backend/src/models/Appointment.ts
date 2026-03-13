import { Schema, model, type Types } from "mongoose";

export type AppointmentStatus = "scheduled" | "waiting" | "completed" | "cancelled";
export type AppointmentType = "consultation" | "follow-up" | "emergency";

export interface AppointmentDocument {
  _id: string;
  patientName: string;
  patientPhone?: string;
  doctorId: Types.ObjectId | string;
  receptionistId: Types.ObjectId | string;
  date: string;
  time: string;
  duration: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<AppointmentDocument>(
  {
    patientName: { type: String, required: true, trim: true },
    patientPhone: { type: String, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receptionistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    appointmentType: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
      required: true
    },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "completed", "cancelled"],
      default: "scheduled"
    },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1, time: 1, status: 1 });

export const AppointmentModel = model<AppointmentDocument>("Appointment", appointmentSchema);
