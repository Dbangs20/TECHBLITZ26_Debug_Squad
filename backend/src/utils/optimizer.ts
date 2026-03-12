import type { ScheduleItem } from "./schedule.js";
import { buildScheduleGaps } from "./schedule.js";

export function analyzeScheduleEfficiency(appointments: ScheduleItem[]) {
  const gaps = buildScheduleGaps(appointments);
  const idleMinutes = gaps.reduce((sum, gap) => sum + gap.minutes, 0);
  const bookedMinutes = appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .reduce((sum, appointment) => sum + appointment.duration, 0);
  const utilization = bookedMinutes === 0 ? 0 : Math.min(100, (bookedMinutes / (bookedMinutes + idleMinutes)) * 100);
  const overbookRisk = appointments.filter((appointment) => appointment.appointmentType === "emergency").length * 6;
  const balancePenalty = gaps.filter((gap) => gap.minutes >= 20).length * 7;
  const efficiencyScore = Math.max(0, Math.round(utilization - overbookRisk - balancePenalty + 18));

  const suggestions = [
    ...gaps
      .filter((gap) => gap.minutes >= 10)
      .slice(0, 2)
      .map((gap) => `Fill ${gap.start} - ${gap.end} gap`),
    ...appointments
      .filter((appointment) => appointment.status === "scheduled")
      .slice(-1)
      .map((appointment) => `Consider moving ${appointment.patientName} from ${appointment.time}`)
  ].slice(0, 3);

  return {
    efficiencyScore,
    metrics: {
      idleMinutes,
      overbookRisk,
      balancedSchedule: Math.max(0, 100 - balancePenalty)
    },
    suggestions
  };
}

export function generateIdleTimeInsights(appointments: ScheduleItem[]) {
  return buildScheduleGaps(appointments)
    .filter((gap) => gap.minutes >= 10)
    .slice(0, 3)
    .map((gap) => ({
      title: `Doctor free from ${gap.start} to ${gap.end}`,
      actions: [`Add a waitlist patient`, `Pull a later patient forward into ${gap.start}`]
    }));
}
