import type { Request, Response } from "express";
import { z } from "zod";

import { AppointmentModel } from "../models/Appointment.js";
import { UserModel } from "../models/User.js";
import { WaitlistModel } from "../models/Waitlist.js";
import { NotificationModel } from "../models/Notification.js";
import { analyzeScheduleEfficiency, generateIdleTimeInsights } from "../utils/optimizer.js";
import {
  APPOINTMENT_DURATIONS,
  detectConflict,
  getOptimalSlot,
  suggestNextAvailableSlots,
  type ScheduleItem
} from "../utils/schedule.js";
import { AppError } from "../utils/http.js";

const appointmentSchema = z.object({
  patientName: z.string().min(2),
  doctorId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  appointmentType: z.enum(["consultation", "follow-up", "emergency"]),
  status: z.enum(["scheduled", "waiting", "completed", "cancelled"]).optional(),
  notes: z.string().optional()
});

const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().min(1)
});

async function getDoctorDayAppointments(doctorId: string, date: string) {
  const appointments = await AppointmentModel.find({ doctorId, date }).lean();
  return appointments.map((appointment) => ({
    ...appointment,
    _id: appointment._id.toString()
  })) as ScheduleItem[];
}

export async function createAppointment(request: Request, response: Response) {
  const payload = appointmentSchema.parse(request.body);
  const duration = APPOINTMENT_DURATIONS[payload.appointmentType];
  const appointments = await getDoctorDayAppointments(payload.doctorId, payload.date);
  const conflict = detectConflict(appointments, payload.time, duration);

  if (conflict) {
    return response.status(409).json({
      message: "This slot is already booked",
      conflict,
      suggestions: suggestNextAvailableSlots(appointments, duration),
      optimalSlot: getOptimalSlot(appointments, duration)
    });
  }

  const appointment = await AppointmentModel.create({
    ...payload,
    duration,
    receptionistId: request.user?.sub
  });

  await NotificationModel.create({
    userId: payload.doctorId,
    title: "New appointment booked",
    message: `${payload.patientName} at ${payload.time} on ${payload.date}`,
    type: "reminder"
  });

  response.status(201).json(appointment);
}

export async function updateAppointment(request: Request, response: Response) {
  const payload = updateAppointmentSchema.parse(request.body);
  const appointment = await AppointmentModel.findById(payload.id);

  if (!appointment) {
    throw new AppError(404, "Appointment not found");
  }

  const nextDoctorId = payload.doctorId ?? appointment.doctorId.toString();
  const nextDate = payload.date ?? appointment.date;
  const nextType = payload.appointmentType ?? appointment.appointmentType;
  const nextDuration = APPOINTMENT_DURATIONS[nextType];
  const nextTime = payload.time ?? appointment.time;
  const appointments = await getDoctorDayAppointments(nextDoctorId, nextDate);
  const conflict = detectConflict(appointments, nextTime, nextDuration, appointment._id.toString());

  if (conflict) {
    return response.status(409).json({
      message: "Reschedule conflicts with an existing appointment",
      conflict,
      suggestions: suggestNextAvailableSlots(appointments, nextDuration),
      optimalSlot: getOptimalSlot(appointments, nextDuration)
    });
  }

  appointment.set({
    ...payload,
    duration: nextDuration
  });

  await appointment.save();
  response.json(appointment);
}

export async function deleteAppointment(request: Request, response: Response) {
  const id = z.string().parse(request.params.id);
  const appointment = await AppointmentModel.findByIdAndUpdate(
    id,
    { status: "cancelled" },
    { new: true }
  );

  if (!appointment) {
    throw new AppError(404, "Appointment not found");
  }

  const waitlistSuggestions = await WaitlistModel.find({
    doctorId: appointment.doctorId,
    preferredDate: appointment.date
  })
    .sort({ urgency: -1, createdAt: 1 })
    .limit(3);

  response.json({
    appointment,
    waitlistSuggestions
  });
}

export async function listAppointments(request: Request, response: Response) {
  const date = z.string().optional().parse(request.query.date);
  const doctorId = z.string().optional().parse(request.query.doctorId);

  const appointments = await AppointmentModel.find({
    ...(date ? { date } : {}),
    ...(doctorId ? { doctorId } : {})
  })
    .populate("doctorId", "name specialization")
    .sort({ date: 1, time: 1 });

  response.json(appointments);
}

export async function getDashboard(request: Request, response: Response) {
  const date = z.string().min(1).parse(request.query.date);
  const doctorId = request.user?.role === "doctor"
    ? request.user.sub
    : z.string().min(1).parse(request.query.doctorId);

  const appointments = await getDoctorDayAppointments(doctorId, date);
  const waitingPatients = appointments.filter((appointment) => appointment.status === "waiting");
  const scheduledPatients = appointments.filter((appointment) => appointment.status === "scheduled");
  const nextPatient = scheduledPatients[0] ?? null;
  const optimizer = analyzeScheduleEfficiency(appointments);
  const idleInsights = generateIdleTimeInsights(appointments);
  const waitlist = await WaitlistModel.find({ doctorId, preferredDate: date })
    .sort({ urgency: -1, createdAt: 1 })
    .limit(5);
  const doctor = await UserModel.findById(doctorId).select("name specialization");

  response.json({
    doctor,
    todaySchedule: appointments,
    nextPatient,
    waitingPatients,
    scheduleHealthScore: optimizer.efficiencyScore,
    efficiency: optimizer,
    idleInsights,
    waitlist
  });
}

export async function getSmartSuggestions(request: Request, response: Response) {
  const doctorId = z.string().min(1).parse(request.query.doctorId);
  const date = z.string().min(1).parse(request.query.date);
  const appointmentType = z
    .enum(["consultation", "follow-up", "emergency"])
    .parse(request.query.appointmentType);
  const appointments = await getDoctorDayAppointments(doctorId, date);
  const duration = APPOINTMENT_DURATIONS[appointmentType];

  response.json({
    optimalSlot: getOptimalSlot(appointments, duration),
    suggestions: suggestNextAvailableSlots(appointments, duration)
  });
}
