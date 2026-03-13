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

export interface PatientVisit {
  id: string;
  patientName: string;
  visitDate: string;
  doctorName: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
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
  autopilotSuggestions: AutopilotSuggestion[];
  digitalTwin: DigitalTwinState;
  patientDirectory: PatientSummary[];
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

export interface AutopilotSuggestion {
  id: string;
  type: "idle-gap" | "waitlist-recovery" | "move-earlier" | "overbook-risk";
  title: string;
  windowLabel: string;
  detail: string;
  actionLabel: string;
  status: "pending" | "applied" | "ignored";
  appointmentId?: string;
  waitlistEntryId?: string;
  suggestedTime?: string;
}

export interface PatientSummary {
  name: string;
  latestVisitDate: string;
  totalVisits: number;
  lastStatus: AppointmentStatus;
  doctorName: string;
}

export interface DigitalTwinState {
  consultationRoom: {
    status: "consulting" | "available";
    doctorName: string;
    patientName: string | null;
  };
  waitingArea: {
    count: number;
    patients: string[];
  };
  nextPatient: {
    patientName: string | null;
    time: string | null;
    appointmentType: AppointmentType | null;
  };
  queueStatus: {
    nowServing: string | null;
    nextPatient: string | null;
  };
}
