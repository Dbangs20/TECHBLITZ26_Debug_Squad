"use client";

import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  DashboardData,
  QueueData,
  Session,
  WaitlistEntry
} from "./types";
import { todayIsoDate } from "./utils";

const DEMO_STATE_KEY = "clinicflow-demo-state";
const defaultDate = todayIsoDate();

type DemoDoctor = {
  _id: string;
  name: string;
  specialization?: string;
};

interface DemoState {
  doctor: DemoDoctor;
  receptionist: {
    id: string;
    name: string;
    email: string;
  };
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
}

const durations: Record<AppointmentType, number> = {
  consultation: 10,
  "follow-up": 5,
  emergency: 20
};

function minutes(time: string) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function timeFromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildDefaultState(): DemoState {
  return {
    doctor: {
      _id: "doctor-demo-1",
      name: "Dr. Aisha Patel",
      specialization: "Family Medicine"
    },
    receptionist: {
      id: "demo-receptionist",
      name: "Maya Brooks",
      email: "demo@clinicflow.app"
    },
    appointments: [
      {
        _id: "apt-1",
        patientName: "Sarah Johnson",
        doctorId: "doctor-demo-1",
        receptionistId: "demo-receptionist",
        date: defaultDate,
        time: "09:00",
        duration: 10,
        appointmentType: "consultation",
        status: "completed"
      },
      {
        _id: "apt-2",
        patientName: "Mike Chen",
        doctorId: "doctor-demo-1",
        receptionistId: "demo-receptionist",
        date: defaultDate,
        time: "09:20",
        duration: 10,
        appointmentType: "consultation",
        status: "waiting"
      },
      {
        _id: "apt-3",
        patientName: "Emily Davis",
        doctorId: "doctor-demo-1",
        receptionistId: "demo-receptionist",
        date: defaultDate,
        time: "09:40",
        duration: 5,
        appointmentType: "follow-up",
        status: "scheduled"
      },
      {
        _id: "apt-4",
        patientName: "James Wilson",
        doctorId: "doctor-demo-1",
        receptionistId: "demo-receptionist",
        date: defaultDate,
        time: "10:00",
        duration: 20,
        appointmentType: "emergency",
        status: "scheduled"
      },
      {
        _id: "apt-5",
        patientName: "Lisa Anderson",
        doctorId: "doctor-demo-1",
        receptionistId: "demo-receptionist",
        date: defaultDate,
        time: "10:40",
        duration: 10,
        appointmentType: "consultation",
        status: "scheduled"
      }
    ],
    waitlist: [
      {
        _id: "wait-1",
        patientName: "Robert Taylor",
        doctorId: "doctor-demo-1",
        preferredDate: defaultDate,
        appointmentType: "consultation",
        urgency: 3
      },
      {
        _id: "wait-2",
        patientName: "Nina Parker",
        doctorId: "doctor-demo-1",
        preferredDate: defaultDate,
        appointmentType: "follow-up",
        urgency: 2
      }
    ]
  };
}

export function getDemoState() {
  if (typeof window === "undefined") {
    return buildDefaultState();
  }

  const stored = window.localStorage.getItem(DEMO_STATE_KEY);
  if (!stored) {
    const state = buildDefaultState();
    saveDemoState(state);
    return state;
  }

  return JSON.parse(stored) as DemoState;
}

export function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

export function buildDemoSession(
  role: "doctor" | "receptionist",
  email?: string,
  name?: string,
  specialization?: string
): Session {
  const state = getDemoState();

  if (role === "doctor") {
    const doctorName = name?.trim() || state.doctor.name;
    return {
      token: "demo-doctor-token",
      user: {
        id: state.doctor._id,
        name: doctorName,
        email: email ?? "doctor@example.com",
        role,
        specialization: specialization ?? state.doctor.specialization
      }
    };
  }

  return {
    token: "demo-receptionist-token",
    user: {
      id: state.receptionist.id,
      name: name?.trim() || state.receptionist.name,
      email: email ?? state.receptionist.email,
      role
    }
  };
}

function getDayAppointments(state: DemoState, date: string) {
  return state.appointments
    .filter((appointment) => appointment.date === date)
    .sort((first, second) => minutes(first.time) - minutes(second.time));
}

function getActiveAppointments(state: DemoState, date: string) {
  return getDayAppointments(state, date).filter((appointment) => appointment.status !== "cancelled");
}

function findConflict(appointments: Appointment[], time: string, duration: number, excludeId?: string) {
  const start = minutes(time);
  const end = start + duration;

  return appointments.find((appointment) => {
    if (appointment._id === excludeId) return false;
    const candidateStart = minutes(appointment.time);
    const candidateEnd = candidateStart + appointment.duration;
    return start < candidateEnd && candidateStart < end;
  });
}

function getGapSuggestions(appointments: Appointment[], duration: number, limit = 5) {
  const suggestions: string[] = [];
  let cursor = 9 * 60;

  for (const appointment of appointments) {
    const start = minutes(appointment.time);
    if (cursor + duration <= start) {
      suggestions.push(timeFromMinutes(cursor));
      if (suggestions.length >= limit) return suggestions;
    }
    cursor = Math.max(cursor, start + appointment.duration);
  }

  while (cursor + duration <= 17 * 60 && suggestions.length < limit) {
    suggestions.push(timeFromMinutes(cursor));
    cursor += 5;
  }

  return suggestions;
}

function getGaps(appointments: Appointment[]) {
  const gaps: Array<{ start: string; end: string; minutes: number }> = [];
  let cursor = 9 * 60;

  for (const appointment of appointments) {
    const start = minutes(appointment.time);
    if (start > cursor) {
      gaps.push({
        start: timeFromMinutes(cursor),
        end: timeFromMinutes(start),
        minutes: start - cursor
      });
    }
    cursor = Math.max(cursor, start + appointment.duration);
  }

  if (cursor < 17 * 60) {
    gaps.push({
      start: timeFromMinutes(cursor),
      end: timeFromMinutes(17 * 60),
      minutes: 17 * 60 - cursor
    });
  }

  return gaps;
}

function buildDashboard(state: DemoState, date: string): DashboardData {
  const schedule = getDayAppointments(state, date);
  const active = getActiveAppointments(state, date);
  const waitingPatients = active.filter((appointment) => appointment.status === "waiting");
  const nextPatient =
    active.find((appointment) => appointment.status === "scheduled") ??
    waitingPatients[0] ??
    null;
  const gaps = getGaps(active);
  const idleMinutes = gaps.reduce((total, gap) => total + gap.minutes, 0);
  const overbookRisk = active.filter((appointment) => appointment.appointmentType === "emergency").length * 6;
  const balancedSchedule = Math.max(0, 100 - gaps.filter((gap) => gap.minutes >= 20).length * 7);
  const efficiencyScore = Math.max(
    0,
    Math.min(100, Math.round((active.reduce((sum, appointment) => sum + appointment.duration, 0) / 480) * 100 + 28 - overbookRisk))
  );

  return {
    doctor: clone(state.doctor),
    todaySchedule: clone(schedule),
    nextPatient: nextPatient ? clone(nextPatient) : null,
    waitingPatients: clone(waitingPatients),
    scheduleHealthScore: efficiencyScore,
    efficiency: {
      efficiencyScore,
      metrics: {
        idleMinutes,
        overbookRisk,
        balancedSchedule
      },
      suggestions: [
        ...gaps.filter((gap) => gap.minutes >= 10).slice(0, 2).map((gap) => `Fill ${gap.start} - ${gap.end} gap`),
        ...active.slice(-1).map((appointment) => `Consider moving ${appointment.patientName} from ${appointment.time}`)
      ].slice(0, 3)
    },
    idleInsights: gaps
      .filter((gap) => gap.minutes >= 10)
      .slice(0, 3)
      .map((gap) => ({
        title: `Doctor free from ${gap.start} to ${gap.end}`,
        actions: ["Add a waitlist patient", `Pull a later patient forward into ${gap.start}`]
      })),
    waitlist: clone(
      state.waitlist
        .filter((entry) => entry.preferredDate === date)
        .sort((first, second) => second.urgency - first.urgency)
    )
  };
}

export function getDemoDashboard(date: string) {
  return buildDashboard(getDemoState(), date);
}

export function getDemoQueue(date: string): QueueData {
  const appointments = getActiveAppointments(getDemoState(), date);
  return {
    nowServing: appointments.find((appointment) => appointment.status === "waiting") ?? null,
    nextPatient: appointments.find((appointment) => appointment.status === "scheduled") ?? null,
    waitingCount: appointments.filter((appointment) => appointment.status === "waiting").length
  };
}

export function createDemoAppointment(payload: {
  patientName: string;
  doctorId: string;
  date: string;
  time: string;
  appointmentType: AppointmentType;
  notes?: string;
}) {
  const state = getDemoState();
  const duration = durations[payload.appointmentType];
  const appointments = getActiveAppointments(state, payload.date);
  const conflict = findConflict(appointments, payload.time, duration);

  if (conflict) {
    const error = new Error("This slot is already booked");
    (error as Error & { details?: unknown }).details = {
      conflict,
      suggestions: getGapSuggestions(appointments, duration),
      optimalSlot: getGaps(appointments).filter((gap) => gap.minutes >= duration).sort((a, b) => a.minutes - b.minutes)[0] ?? null
    };
    throw error;
  }

  const appointment: Appointment = {
    _id: crypto.randomUUID(),
    patientName: payload.patientName,
    doctorId: payload.doctorId,
    receptionistId: state.receptionist.id,
    date: payload.date,
    time: payload.time,
    duration,
    appointmentType: payload.appointmentType,
    status: "scheduled",
    notes: payload.notes
  };

  state.appointments.push(appointment);
  saveDemoState(state);
  return appointment;
}

export function updateDemoAppointment(payload: {
  id: string;
  date?: string;
  time?: string;
  appointmentType?: AppointmentType;
  status?: AppointmentStatus;
}) {
  const state = getDemoState();
  const appointment = state.appointments.find((item) => item._id === payload.id);
  if (!appointment) throw new Error("Appointment not found");

  const nextDate = payload.date ?? appointment.date;
  const nextType = payload.appointmentType ?? appointment.appointmentType;
  const nextTime = payload.time ?? appointment.time;
  const duration = durations[nextType];
  const conflict = findConflict(getActiveAppointments(state, nextDate), nextTime, duration, appointment._id);

  if (conflict) {
    throw new Error("Reschedule conflicts with an existing appointment");
  }

  appointment.date = nextDate;
  appointment.time = nextTime;
  appointment.appointmentType = nextType;
  appointment.duration = duration;
  if (payload.status) appointment.status = payload.status;
  saveDemoState(state);
  return clone(appointment);
}

export function cancelDemoAppointment(id: string) {
  const state = getDemoState();
  const appointment = state.appointments.find((item) => item._id === id);
  if (!appointment) throw new Error("Appointment not found");
  appointment.status = "cancelled";
  saveDemoState(state);

  return {
    appointment: clone(appointment),
    waitlistSuggestions: clone(
      state.waitlist
        .filter((entry) => entry.preferredDate === appointment.date)
        .sort((first, second) => second.urgency - first.urgency)
        .slice(0, 3)
    )
  };
}

export function completeDemoAppointment(id: string) {
  const state = getDemoState();
  const appointment = state.appointments.find((item) => item._id === id);
  if (!appointment) throw new Error("Appointment not found");
  appointment.status = "completed";
  saveDemoState(state);
  return clone(appointment);
}

export function getDemoSmartSlots(appointmentType: AppointmentType, date: string) {
  const appointments = getActiveAppointments(getDemoState(), date);
  const duration = durations[appointmentType];
  return {
    optimalSlot:
      getGaps(appointments)
        .filter((gap) => gap.minutes >= duration)
        .sort((first, second) => first.minutes - second.minutes)[0] ?? null,
    suggestions: getGapSuggestions(appointments, duration)
  };
}

export function addDemoWaitlist(payload: {
  patientName: string;
  doctorId: string;
  preferredDate: string;
  appointmentType: AppointmentType;
  urgency: number;
}) {
  const state = getDemoState();
  const entry: WaitlistEntry = {
    _id: crypto.randomUUID(),
    ...payload
  };
  state.waitlist.push(entry);
  saveDemoState(state);
  return entry;
}
