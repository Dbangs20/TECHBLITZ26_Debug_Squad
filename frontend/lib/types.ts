export type Role = "doctor" | "receptionist";
export type AppointmentType = "consultation" | "follow-up" | "emergency";
export type AppointmentStatus = "scheduled" | "waiting" | "completed" | "cancelled";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization?: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

export interface Appointment {
  _id: string;
  patientName: string;
  doctorId: string | { _id: string; name: string; specialization?: string };
  receptionistId?: string;
  date: string;
  time: string;
  duration: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
}

export interface WaitlistEntry {
  _id: string;
  patientName: string;
  doctorId: string;
  preferredDate: string;
  appointmentType: AppointmentType;
  urgency: number;
}

export interface DashboardData {
  doctor: {
    _id: string;
    name: string;
    specialization?: string;
  };
  todaySchedule: Appointment[];
  nextPatient: Appointment | null;
  waitingPatients: Appointment[];
  scheduleHealthScore: number;
  efficiency: {
    efficiencyScore: number;
    metrics: {
      idleMinutes: number;
      overbookRisk: number;
      balancedSchedule: number;
    };
    suggestions: string[];
  };
  idleInsights: Array<{
    title: string;
    actions: string[];
  }>;
  waitlist: WaitlistEntry[];
}

export interface QueueData {
  nowServing: Appointment | null;
  nextPatient: Appointment | null;
  waitingCount: number;
}
