import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;
  return `${normalizedHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const normalized = normalizePhoneNumber(phone).replace(/^\+/, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildAppointmentWhatsAppMessage(payload: {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  appointmentType: string;
}) {
  return [
    `Hello ${payload.patientName},`,
    `Your ClinicFlow appointment is confirmed.`,
    `Doctor: ${payload.doctorName}`,
    `Date: ${payload.date}`,
    `Time: ${formatTime(payload.time)}`,
    `Type: ${payload.appointmentType}`,
    "Please arrive 10 minutes early. Reply here if you need to reschedule."
  ].join("\n");
}
