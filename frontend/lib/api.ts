"use client";

import {
  addDemoWaitlist,
  buildDemoSession,
  cancelDemoAppointment,
  completeDemoAppointment,
  createDemoAppointment,
  getDemoDashboard,
  getDemoQueue,
  getDemoSmartSlots,
  updateDemoAppointment
} from "./demo-store";
import { demoDoctorId } from "./mock-data";
import type { AppointmentType, DashboardData, QueueData, Session, WaitlistEntry } from "./types";
import { todayIsoDate } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function signup(payload: {
  name: string;
  email: string;
  password: string;
  role: "doctor" | "receptionist";
  specialization?: string;
}) {
  try {
    return await request<Session>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch {
    return buildDemoSession(payload.role, payload.email, payload.name, payload.specialization);
  }
}

export async function login(payload: { email: string; password: string }) {
  try {
    return await request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch {
    const isDoctor = payload.email.toLowerCase().includes("doctor");
    return buildDemoSession(
      isDoctor ? "doctor" : "receptionist",
      payload.email,
      isDoctor ? "Dr. Aisha Patel" : "Maya Brooks"
    );
  }
}

export async function fetchDashboard(token: string, doctorId: string, date = todayIsoDate()) {
  try {
    return await request<DashboardData>(
      `/appointments/dashboard?doctorId=${doctorId}&date=${date}`,
      undefined,
      token
    );
  } catch {
    return getDemoDashboard(date);
  }
}

export async function fetchQueue(token: string, doctorId: string, date = todayIsoDate()) {
  try {
    return await request<QueueData>(
      `/queue/current?doctorId=${doctorId}&date=${date}`,
      undefined,
      token
    );
  } catch {
    return getDemoQueue(date);
  }
}

export async function createAppointment(
  token: string,
  payload: {
    patientName: string;
    doctorId: string;
    date: string;
    time: string;
    appointmentType: AppointmentType;
    notes?: string;
  }
) {
  try {
    return await request("/appointments/create", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  } catch {
    return createDemoAppointment({ ...payload, doctorId: payload.doctorId || demoDoctorId });
  }
}

export async function updateAppointment(
  token: string,
  payload: {
    id: string;
    date?: string;
    time?: string;
    appointmentType?: AppointmentType;
    status?: "scheduled" | "waiting" | "completed" | "cancelled";
  }
) {
  try {
    return await request("/appointments/update", {
      method: "PUT",
      body: JSON.stringify(payload)
    }, token);
  } catch {
    return updateDemoAppointment(payload);
  }
}

export async function cancelAppointment(token: string, id: string) {
  try {
    return await request<{ waitlistSuggestions: WaitlistEntry[] }>(`/appointments/delete/${id}`, {
      method: "DELETE"
    }, token);
  } catch {
    return cancelDemoAppointment(id);
  }
}

export async function completeAppointment(token: string, id: string) {
  try {
    return await request(`/queue/complete/${id}`, { method: "PATCH" }, token);
  } catch {
    return completeDemoAppointment(id);
  }
}

export async function fetchSmartSlots(
  token: string,
  doctorId: string,
  appointmentType: AppointmentType,
  date = todayIsoDate()
) {
  try {
    return await request<{
      optimalSlot: { start: string; end: string; minutes: number } | null;
      suggestions: string[];
    }>(
      `/appointments/smart-slots?doctorId=${doctorId}&appointmentType=${appointmentType}&date=${date}`,
      undefined,
      token
    );
  } catch {
    return getDemoSmartSlots(appointmentType, date);
  }
}

export async function addToWaitlist(
  token: string,
  payload: {
    patientName: string;
    doctorId: string;
    preferredDate: string;
    appointmentType: AppointmentType;
    urgency: number;
  }
) {
  try {
    return await request("/waitlist/add", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  } catch {
    return addDemoWaitlist(payload);
  }
}
