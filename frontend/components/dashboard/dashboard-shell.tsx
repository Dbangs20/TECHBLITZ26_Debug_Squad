"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  CalendarPlus,
  CalendarX2,
  ClipboardList,
  Command,
  LogOut,
  MoonStar,
  Settings,
  Sparkles,
  Syringe,
  SunMedium,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

import { cancelAppointment, completeAppointment, fetchDashboard, fetchQueue, fetchSmartSlots, updateAppointment } from "@/lib/api";
import { demoDoctorId } from "@/lib/mock-data";
import type { DashboardData, QueueData, Session } from "@/lib/types";
import { formatTime, todayIsoDate } from "@/lib/utils";
import { ClinicFlowLogo } from "@/components/landing/logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BookingModal } from "@/components/modals/booking-modal";
import { useToast } from "@/components/ui/toast";

const menu = [
  { id: "overview", label: "Overview", icon: Activity, target: "overview-section" },
  { id: "schedule", label: "Schedule", icon: ClipboardList, target: "schedule-section" },
  { id: "queue", label: "Queue", icon: Users, target: "queue-section" },
  { id: "insights", label: "Insights", icon: Sparkles, target: "insights-section" },
  { id: "settings", label: "Settings", icon: Settings, target: "settings-section" }
];

export function DashboardShell({
  session,
  onLogout
}: {
  session: Session;
  onLogout: () => void;
}) {
  const { push } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [queue, setQueue] = React.useState<QueueData | null>(null);
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const doctorId = dashboard?.doctor?._id ?? (session.user.role === "doctor" ? session.user.id : demoDoctorId);

  const refresh = React.useCallback(async () => {
    const [dashboardData, queueData] = await Promise.all([
      fetchDashboard(session.token, doctorId, todayIsoDate()),
      fetchQueue(session.token, doctorId, todayIsoDate())
    ]);
    setDashboard(dashboardData);
    setQueue(queueData);
  }, [doctorId, session.token]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function markComplete(id: string) {
    try {
      await completeAppointment(session.token, id);
      push({ title: "Appointment completed", description: "Queue and schedule updated." });
      await refresh();
    } catch (error) {
      push({ title: "Unable to complete appointment", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  async function cancel(id: string) {
    try {
      const result = await cancelAppointment(session.token, id);
      push({
        title: "Appointment cancelled",
        description: result.waitlistSuggestions.length
          ? `${result.waitlistSuggestions.length} waitlist suggestions surfaced.`
          : "No waitlist suggestions available."
      });
      await refresh();
    } catch (error) {
      push({ title: "Unable to cancel appointment", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  async function smartReschedule(id: string, appointmentType: "consultation" | "follow-up" | "emergency", date: string) {
    try {
      const result = await fetchSmartSlots(session.token, doctorId, appointmentType, date);
      const currentAppointment = dashboard?.todaySchedule.find((appointment) => appointment._id === id);
      const nextSlot = result.suggestions.find((slot) => slot !== currentAppointment?.time) ?? result.suggestions[0];

      if (!nextSlot) {
        push({ title: "No better slot found", description: "ClinicFlow did not find a valid reschedule slot." });
        return;
      }

      await updateAppointment(session.token, {
        id,
        time: nextSlot,
        appointmentType
      });
      push({ title: "Appointment rescheduled", description: `Moved to ${formatTime(nextSlot)}.` });
      await refresh();
    } catch (error) {
      push({ title: "Unable to reschedule", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  if (!dashboard || !queue) {
    return <div className="px-6 py-16 text-center text-slate-500">Loading ClinicFlow workspace...</div>;
  }

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        token={session.token}
        doctorId={doctorId}
        onSuccess={async (message) => {
          push({ title: message });
          await refresh();
        }}
      />
      <CommandCenter
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onAction={(action) => {
          if (action === "book") setBookingOpen(true);
          if (action === "waitlist") document.getElementById("waitlist-section")?.scrollIntoView({ behavior: "smooth" });
          if (action === "schedule") document.getElementById("schedule-section")?.scrollIntoView({ behavior: "smooth" });
          if (action === "queue") document.getElementById("queue-section")?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-[112px_minmax(0,1fr)] xl:gap-8">
        <Card className="sticky top-4 flex h-fit flex-col items-center gap-6 p-4">
          <ClinicFlowLogo compact />
          <div className="mt-1 flex w-full flex-col gap-3">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-slate-500 transition hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-6 xl:space-y-8">
          <Card id="overview-section" className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-slate-500">
                {session.user.role === "doctor" ? "Doctor Dashboard" : "Receptionist Dashboard"}
              </div>
              <CardTitle className="mt-1">
                Welcome back, {session.user.role === "doctor" ? dashboard.doctor.name : session.user.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {dashboard.doctor.name} • {dashboard.doctor.specialization ?? "Clinic operations"} • {todayIsoDate()}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setCommandOpen(true)}>
                <Command className="mr-2 h-4 w-4" />
                Command Center
              </Button>
              {session.user.role === "receptionist" ? (
                <Button onClick={() => setBookingOpen(true)}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
              ) : null}
              <Button variant="ghost" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today's Appointments" value={String(dashboard.todaySchedule.length)} tint="from-sky-100 to-cyan-100" />
            <StatCard label="Patients Waiting" value={String(queue.waitingCount)} tint="from-emerald-100 to-lime-100" />
            <StatCard label="Next Patient" value={dashboard.nextPatient ? formatTime(dashboard.nextPatient.time) : "None"} tint="from-amber-100 to-orange-100" />
            <StatCard label="Health Score" value={`${dashboard.scheduleHealthScore}%`} tint="from-violet-100 to-fuchsia-100" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <Card id="schedule-section" className="p-6 xl:p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Daily timeline</CardTitle>
                  <CardDescription className="mt-1">Today’s schedule with status-aware patient movement.</CardDescription>
                </div>
                <Badge className="bg-slate-950 text-white">Live schedule</Badge>
              </div>
              <div className="mt-6 space-y-3">
                {dashboard.todaySchedule.map((appointment, index) => (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col gap-4 rounded-[24px] border border-white/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-sm font-semibold text-slate-500 dark:text-slate-400">{formatTime(appointment.time)}</div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{appointment.patientName}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {appointment.appointmentType} • {appointment.duration} min
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <StatusBadge status={appointment.status} />
                      {session.user.role === "doctor" && appointment.status !== "completed" ? (
                        <Button size="sm" variant="secondary" onClick={() => markComplete(appointment._id)}>
                          Mark completed
                        </Button>
                      ) : null}
                      {session.user.role === "receptionist" && appointment.status !== "cancelled" ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => smartReschedule(appointment._id, appointment.appointmentType, appointment.date)}
                          >
                            <Syringe className="mr-2 h-4 w-4" />
                            Smart move
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => cancel(appointment._id)}>
                            <CalendarX2 className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card id="queue-section" className="p-6">
                <CardTitle>Queue management</CardTitle>
                <div className="mt-5 grid gap-4">
                  <QueueBlock label="Now Serving" patient={queue.nowServing?.patientName ?? "No active patient"} />
                  <QueueBlock label="Next Patient" patient={queue.nextPatient?.patientName ?? "Queue clear"} />
                  <QueueBlock label="Waiting Count" patient={String(queue.waitingCount)} highlight />
                </div>
              </Card>

              <Card className="p-6">
                <CardTitle>Doctor Idle Time Intelligence</CardTitle>
                <div className="mt-5 space-y-3">
                  {dashboard.idleInsights.map((insight) => (
                    <div key={insight.title} className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                      <div className="font-semibold text-slate-900 dark:text-slate-50">{insight.title}</div>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{insight.actions.join(" • ")}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div id="insights-section" className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card id="waitlist-section" className="p-6">
              <CardTitle>Waitlist recovery</CardTitle>
              <CardDescription className="mt-1">Suggested patients when a slot opens up.</CardDescription>
              <div className="mt-5 space-y-3">
                {dashboard.waitlist.map((entry) => (
                  <div key={entry._id} className="rounded-[24px] border border-white/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{entry.patientName}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{entry.appointmentType}</div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">Urgency {entry.urgency}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle>AI Smart Day Optimizer</CardTitle>
              <CardDescription className="mt-1">Efficiency scoring across idle time, overbook risk, and balance.</CardDescription>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Metric label="Efficiency" value={`${dashboard.efficiency.efficiencyScore}%`} />
                <Metric label="Idle Minutes" value={String(dashboard.efficiency.metrics.idleMinutes)} />
                <Metric label="Balanced" value={`${dashboard.efficiency.metrics.balancedSchedule}%`} />
              </div>
              <div className="mt-6 rounded-[28px] border border-sky-100 bg-gradient-to-r from-sky-50 to-emerald-50 p-5 dark:border-sky-900/50 dark:from-slate-900 dark:to-cyan-950/40">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Bell className="h-4 w-4 text-sky-600" />
                  Optimizer suggestions
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                  {dashboard.efficiency.suggestions.map((suggestion) => (
                    <div key={suggestion}>• {suggestion}</div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card id="settings-section" className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription className="mt-1">
                  Switch between the brighter clinic workspace and the darker command-center mode inspired by the recording.
                </CardDescription>
              </div>
              <Button variant="secondary" onClick={toggleTheme}>
                {theme === "dark" ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Use bright mode" : "Use dark mode"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tint
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <Card className={`bg-gradient-to-br ${tint} border-transparent`}>
      <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
      <div className="mt-4 font-display text-4xl font-semibold text-slate-950 dark:text-slate-50">{value}</div>
    </Card>
  );
}

function StatusBadge({
  status
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    scheduled: "bg-sky-100 text-sky-700",
    waiting: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700"
  };

  return <Badge className={styles[status] ?? "bg-slate-100 text-slate-600"}>{status}</Badge>;
}

function QueueBlock({
  label,
  patient,
  highlight = false
}: {
  label: string;
  patient: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-[24px] p-4 ${highlight ? "bg-slate-950 text-white dark:bg-slate-900" : "border border-white/70 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60"}`}>
      <div className={`text-sm ${highlight ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{label}</div>
      <div className="mt-2 text-xl font-semibold">{patient}</div>
    </div>
  );
}

function Metric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

function CommandCenter({
  open,
  onOpenChange,
  onAction
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: "book" | "schedule" | "waitlist" | "queue") => void;
}) {
  const [query, setQuery] = React.useState("");
  const actions = [
    { id: "book", label: "Book Appointment" },
    { id: "schedule", label: "View Schedule" },
    { id: "book", label: "Add Patient" },
    { id: "waitlist", label: "Open Waitlist" },
    { id: "queue", label: "Live Queue" }
  ] as const;
  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/20 p-6 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div className="mt-20 w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-glass backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a command..."
          className="w-full rounded-[22px] border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
        />
        <div className="mt-4 space-y-2">
          {filteredActions.map((action, index) => (
            <button
              key={`${action.id}-${index}`}
              onClick={() => {
                onAction(action.id);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left text-slate-700 transition hover:bg-emerald-400 hover:text-white dark:text-slate-200"
            >
              <span>{action.label}</span>
              <span className="text-xs uppercase tracking-[0.2em]">Go</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
