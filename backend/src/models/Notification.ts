import { Schema, model, type Types } from "mongoose";

export interface NotificationDocument {
  _id: string;
  userId: Types.ObjectId | string;
  title: string;
  message: string;
  type: "reminder" | "alert" | "insight";
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["reminder", "alert", "insight"], required: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const NotificationModel = model<NotificationDocument>("Notification", notificationSchema);
