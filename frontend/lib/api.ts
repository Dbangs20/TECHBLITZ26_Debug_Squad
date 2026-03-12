"use client";

import { demoDashboard, demoQueue, demoSession } from "./mock-data";
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
    return {
      token: "demo-signup-token",
      user: {
        id: payload.role === "doctor" ? "demo-doctor" : demoSession.user.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        specialization: payload.specialization
      }
    };
  }
}

export async function login(payload: { email: string; password: string }) {
  try {
    return await request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch {
    return {
      ...demoSession,
      user: {
        ...demoSession.user,
        email: payload.email,
        role: payload.email.toLowerCase().includes("doctor") ? "doctor" : "receptionist"
      }
    };
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
    return demoDashboard;
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
    return demoQueue;
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
  return request("/appointments/create", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
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
  return request("/appointments/update", {
    method: "PUT",
    body: JSON.stringify(payload)
  }, token);
}

export async function cancelAppointment(token: string, id: string) {
  return request<{ waitlistSuggestions: WaitlistEntry[] }>(`/appointments/delete/${id}`, {
    method: "DELETE"
  }, token);
}

export async function completeAppointment(token: string, id: string) {
  return request(`/queue/complete/${id}`, { method: "PATCH" }, token);
}

export async function fetchSmartSlots(
  token: string,
  doctorId: string,
  appointmentType: AppointmentType,
  date = todayIsoDate()
) {
  return request<{
    optimalSlot: { start: string; end: string; minutes: number } | null;
    suggestions: string[];
  }>(
    `/appointments/smart-slots?doctorId=${doctorId}&appointmentType=${appointmentType}&date=${date}`,
    undefined,
    token
  );
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
  return request("/waitlist/add", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}
