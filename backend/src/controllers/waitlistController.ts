import type { Request, Response } from "express";
import { z } from "zod";

import { WaitlistModel } from "../models/Waitlist.js";

const waitlistSchema = z.object({
  patientName: z.string().min(2),
  doctorId: z.string().min(1),
  preferredDate: z.string().min(1),
  appointmentType: z.enum(["consultation", "follow-up", "emergency"]),
  urgency: z.number().min(1).max(5).default(1)
});

export async function addToWaitlist(request: Request, response: Response) {
  const payload = waitlistSchema.parse(request.body);
  const entry = await WaitlistModel.create(payload);
  response.status(201).json(entry);
}

export async function listWaitlist(request: Request, response: Response) {
  const doctorId = z.string().optional().parse(request.query.doctorId);
  const preferredDate = z.string().optional().parse(request.query.preferredDate);

  const entries = await WaitlistModel.find({
    ...(doctorId ? { doctorId } : {}),
    ...(preferredDate ? { preferredDate } : {})
  }).sort({ urgency: -1, createdAt: 1 });

  response.json(entries);
}
