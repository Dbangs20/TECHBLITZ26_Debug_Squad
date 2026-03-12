import type { DashboardData, QueueData, Session } from "./types";
import { todayIsoDate } from "./utils";

const today = todayIsoDate();

export const demoSession: Session = {
  token: "demo-token",
  user: {
    id: "demo-receptionist",
    name: "Maya Brooks",
    email: "demo@clinicflow.app",
    role: "receptionist"
  }
};

export const demoDoctorId = "doctor-demo-1";

export const demoDashboard: DashboardData = {
  doctor: {
    _id: demoDoctorId,
    name: "Dr. Aisha Patel",
    specialization: "Family Medicine"
  },
  todaySchedule: [
    {
      _id: "apt-1",
      patientName: "Sarah Johnson",
      doctorId: demoDoctorId,
      date: today,
      time: "09:00",
      duration: 10,
      appointmentType: "consultation",
      status: "completed"
    },
    {
      _id: "apt-2",
      patientName: "Mike Chen",
      doctorId: demoDoctorId,
      date: today,
      time: "09:20",
      duration: 10,
      appointmentType: "consultation",
      status: "waiting"
    },
    {
      _id: "apt-3",
      patientName: "Emily Davis",
      doctorId: demoDoctorId,
      date: today,
      time: "09:40",
      duration: 5,
      appointmentType: "follow-up",
      status: "scheduled"
    },
    {
      _id: "apt-4",
      patientName: "James Wilson",
      doctorId: demoDoctorId,
      date: today,
      time: "10:00",
      duration: 20,
      appointmentType: "emergency",
      status: "scheduled"
    },
    {
      _id: "apt-5",
      patientName: "Lisa Anderson",
      doctorId: demoDoctorId,
      date: today,
      time: "10:40",
      duration: 10,
      appointmentType: "consultation",
      status: "scheduled"
    }
  ],
  nextPatient: {
    _id: "apt-3",
    patientName: "Emily Davis",
    doctorId: demoDoctorId,
    date: today,
    time: "09:40",
    duration: 5,
    appointmentType: "follow-up",
    status: "scheduled"
  },
  waitingPatients: [
    {
      _id: "apt-2",
      patientName: "Mike Chen",
      doctorId: demoDoctorId,
      date: today,
      time: "09:20",
      duration: 10,
      appointmentType: "consultation",
      status: "waiting"
    }
  ],
  scheduleHealthScore: 87,
  efficiency: {
    efficiencyScore: 87,
    metrics: {
      idleMinutes: 35,
      overbookRisk: 6,
      balancedSchedule: 86
    },
    suggestions: ["Fill 10:20 - 10:40 gap", "Consider moving Lisa Anderson from 10:40"]
  },
  idleInsights: [
    {
      title: "Doctor free from 10:20 to 10:40",
      actions: ["Add a waitlist patient", "Pull a later patient forward into 10:20"]
    }
  ],
  waitlist: [
    {
      _id: "wait-1",
      patientName: "Robert Taylor",
      doctorId: demoDoctorId,
      preferredDate: today,
      appointmentType: "consultation",
      urgency: 3
    },
    {
      _id: "wait-2",
      patientName: "Nina Parker",
      doctorId: demoDoctorId,
      preferredDate: today,
      appointmentType: "follow-up",
      urgency: 2
    }
  ]
};

export const demoQueue: QueueData = {
  nowServing: demoDashboard.waitingPatients[0],
  nextPatient: demoDashboard.nextPatient,
  waitingCount: 1
};
