import { buildDemoSession, getDemoDashboard, getDemoQueue } from "./demo-store";
import { todayIsoDate } from "./utils";

export const demoSession = buildDemoSession("receptionist", "demo@clinicflow.app", "Maya Brooks");
export const demoDoctorId = "doctor-demo-1";
export const demoDashboard = getDemoDashboard(todayIsoDate());
export const demoQueue = getDemoQueue(todayIsoDate());
