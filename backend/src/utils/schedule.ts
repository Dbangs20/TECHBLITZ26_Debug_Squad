import type { AppointmentType } from "../models/Appointment.js";

export const APPOINTMENT_DURATIONS: Record<AppointmentType, number> = {
  consultation: 10,
  "follow-up": 5,
  emergency: 20
};

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ScheduleItem {
  _id: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  appointmentType: AppointmentType;
  status: string;
}

const CLINIC_DAY_START = 9 * 60;
const CLINIC_DAY_END = 17 * 60;

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function createRange(time: string, duration: number): TimeSlot {
  const start = timeToMinutes(time);
  return { start: minutesToTime(start), end: minutesToTime(start + duration) };
}

export function rangesOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number
) {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function detectConflict(
  appointments: ScheduleItem[],
  candidateTime: string,
  candidateDuration: number,
  excludeId?: string
) {
  const candidateStart = timeToMinutes(candidateTime);
  const candidateEnd = candidateStart + candidateDuration;

  return appointments.find((appointment) => {
    if (excludeId && appointment._id === excludeId) return false;
    if (appointment.status === "cancelled") return false;

    const existingStart = timeToMinutes(appointment.time);
    const existingEnd = existingStart + appointment.duration;

    return rangesOverlap(candidateStart, candidateEnd, existingStart, existingEnd);
  });
}

export function suggestNextAvailableSlots(
  appointments: ScheduleItem[],
  requestedDuration: number,
  limit = 5
) {
  const suggestions: string[] = [];
  const sorted = [...appointments]
    .filter((appointment) => appointment.status !== "cancelled")
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  let cursor = CLINIC_DAY_START;

  for (const appointment of sorted) {
    const nextStart = timeToMinutes(appointment.time);
    if (cursor + requestedDuration <= nextStart) {
      suggestions.push(minutesToTime(cursor));
      if (suggestions.length >= limit) return suggestions;
    }
    cursor = Math.max(cursor, nextStart + appointment.duration);
  }

  while (cursor + requestedDuration <= CLINIC_DAY_END && suggestions.length < limit) {
    suggestions.push(minutesToTime(cursor));
    cursor += 5;
  }

  return suggestions;
}

export function buildScheduleGaps(appointments: ScheduleItem[]) {
  const sorted = [...appointments]
    .filter((appointment) => appointment.status !== "cancelled")
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const gaps: Array<{ start: string; end: string; minutes: number }> = [];
  let cursor = CLINIC_DAY_START;

  for (const appointment of sorted) {
    const start = timeToMinutes(appointment.time);
    if (start > cursor) {
      gaps.push({
        start: minutesToTime(cursor),
        end: minutesToTime(start),
        minutes: start - cursor
      });
    }
    cursor = Math.max(cursor, start + appointment.duration);
  }

  if (cursor < CLINIC_DAY_END) {
    gaps.push({
      start: minutesToTime(cursor),
      end: minutesToTime(CLINIC_DAY_END),
      minutes: CLINIC_DAY_END - cursor
    });
  }

  return gaps;
}

export function getOptimalSlot(
  appointments: ScheduleItem[],
  requestedDuration: number
) {
  const gaps = buildScheduleGaps(appointments).filter((gap) => gap.minutes >= requestedDuration);
  return gaps.sort((a, b) => a.minutes - b.minutes)[0] ?? null;
}
