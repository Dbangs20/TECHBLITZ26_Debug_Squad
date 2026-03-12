import type { Request, Response } from "express";
import { z } from "zod";

import { AppointmentModel } from "../models/Appointment.js";
import { AppError } from "../utils/http.js";

export async function getCurrentQueue(request: Request, response: Response) {
  const doctorId = z.string().min(1).parse(request.query.doctorId);
  const date = z.string().min(1).parse(request.query.date);
  const appointments = await AppointmentModel.find({
    doctorId,
    date,
    status: { $in: ["waiting", "scheduled"] }
  }).sort({ time: 1 });

  response.json({
    nowServing: appointments.find((appointment) => appointment.status === "waiting") ?? null,
    nextPatient: appointments.find((appointment) => appointment.status === "scheduled") ?? null,
    waitingCount: appointments.filter((appointment) => appointment.status === "waiting").length
  });
}

export async function completeAppointment(request: Request, response: Response) {
  const id = z.string().parse(request.params.id);
  const appointment = await AppointmentModel.findByIdAndUpdate(
    id,
    { status: "completed" },
    { new: true }
  );

  if (!appointment) {
    throw new AppError(404, "Appointment not found");
  }

  response.json(appointment);
}
