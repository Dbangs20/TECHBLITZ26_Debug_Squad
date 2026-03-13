"use client";

import * as React from "react";
import {
  Activity,
  AlarmClock,
  Bell,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  ChartColumn,
  CheckCircle2,
  ClipboardList,
  Command,
  LogOut,
  Monitor,
  MoonStar,
  Sparkles,
  Stethoscope,
  SunMedium,
  Syringe,
  TrendingUp,
  UserRound,
  Users,
  Waves,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  cancelAppointment,
  completeAppointment,
  fetchDashboard,
  fetchQueue,
  fetchSmartSlots,
  updateAppointment
} from "@/lib/api";
import { demoDoctorId } from "@/lib/mock-data";
import type { Appointment, DashboardData, QueueData, Session } from "@/lib/types";
import { formatTime, todayIsoDate } from "@/lib/utils";
import { ClinicFlowLogo } from "@/components/landing/logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BookingModal } from "@/components/modals/booking-modal";
import { useToast } from "@/components/ui/toast";

const menu = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "schedule", label: "Schedule", icon: ClipboardList },
  { id: "queue", label: "Queue", icon: Users },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: ChartColumn }
] as const;

type SectionId = (typeof menu)[number]["id"];

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
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");
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
      setActiveSection("queue");
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
      setActiveSection("schedule");
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
      setActiveSection("schedule");
    } catch (error) {
      push({ title: "Unable to reschedule", description: error instanceof Error ? error.message : "Try again" });
    }
  }

  if (!dashboard || !queue) {
    return <div className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">Loading ClinicFlow workspace...</div>;
  }

  const activeAppointments = dashboard.todaySchedule.filter((appointment) => appointment.status !== "cancelled");
  const completedCount = dashboard.todaySchedule.filter((appointment) => appointment.status === "completed").length;
  const scheduledCount = dashboard.todaySchedule.filter((appointment) => appointment.status === "scheduled").length;
  const availableSlots = Math.max(0, Math.round(dashboard.efficiency.metrics.idleMinutes / 10));
  const utilizationRate = Math.min(
    100,
    Math.round((activeAppointments.reduce((sum, appointment) => sum + appointment.duration, 0) / 480) * 100)
  );

  const topCards = session.user.role === "doctor"
    ? [
        { label: "Next Patient", value: dashboard.nextPatient ? formatTime(dashboard.nextPatient.time) : "No queue", detail: dashboard.nextPatient?.patientName ?? "Day is clear", icon: AlarmClock, accent: "cyan" },
        { label: "Total Patients Today", value: String(activeAppointments.length), detail: `${completedCount} completed`, icon: Stethoscope, accent: "emerald" },
        { label: "Waiting Queue", value: String(queue.waitingCount), detail: queue.nowServing?.patientName ?? "Queue clear", icon: Users, accent: "amber" },
        { label: "Health Score", value: `${dashboard.scheduleHealthScore}%`, detail: `${dashboard.efficiency.metrics.idleMinutes} idle mins`, icon: TrendingUp, accent: "violet" }
      ]
    : [
        { label: "Today's Appointments", value: String(activeAppointments.length), detail: `${completedCount} completed`, icon: CalendarClock, accent: "cyan" },
        { label: "Patients Waiting", value: String(queue.waitingCount), detail: queue.nowServing?.patientName ?? "Queue clear", icon: Users, accent: "emerald" },
        { label: "Available Slots", value: String(availableSlots), detail: `${dashboard.efficiency.metrics.idleMinutes} idle mins`, icon: Waves, accent: "teal" },
        { label: "Schedule Efficiency", value: `${dashboard.scheduleHealthScore}%`, detail: `${scheduledCount} still to serve`, icon: ChartColumn, accent: "violet" }
      ];

  const notifications = [
    {
      id: "n1",
      title: "Appointment confirmed",
      description: `${dashboard.doctor.name} has ${activeAppointments.length} active appointments today.`,
      accent: "sky",
      time: "Just now"
    },
    {
      id: "n2",
      title: "Slot freed",
      description: `${dashboard.efficiency.metrics.idleMinutes} minutes of open time can still be recovered.`,
      accent: "emerald",
      time: "5 mins ago"
    },
    {
      id: "n3",
      title: "Waitlist updates",
      description: `${dashboard.waitlist.length} patient${dashboard.waitlist.length === 1 ? "" : "s"} can be notified if a slot opens.`,
      accent: "amber",
      time: "12 mins ago"
    },
    {
      id: "n4",
      title: "Reminder sent",
      description: queue.nextPatient ? `Reminder sent to ${queue.nextPatient.patientName} for ${formatTime(queue.nextPatient.time)}.` : "No reminder pending right now.",
      accent: "violet",
      time: "18 mins ago"
    }
  ];

  const weeklyEfficiency = [
    { day: "Mon", efficiency: 88 },
    { day: "Tue", efficiency: 92 },
    { day: "Wed", efficiency: 85 },
    { day: "Thu", efficiency: 94 },
    { day: "Fri", efficiency: 90 }
  ];

  const patientsPerHour = [
    { hour: "9AM", patients: 4 },
    { hour: "10AM", patients: 5 },
    { hour: "11AM", patients: 3 },
    { hour: "12PM", patients: 2 },
    { hour: "1PM", patients: 4 },
    { hour: "2PM", patients: 6 },
    { hour: "3PM", patients: 5 },
    { hour: "4PM", patients: 3 }
  ];

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        token={session.token}
        doctorId={doctorId}
        onSuccess={async (message) => {
          push({ title: message, description: "Dashboard metrics and schedule were refreshed." });
          await refresh();
          setActiveSection("schedule");
        }}
      />
      <CommandCenter
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onAction={(action) => {
          if (action === "book") setBookingOpen(true);
          if (action === "waitlist") setActiveSection("insights");
          if (action === "schedule") setActiveSection("schedule");
          if (action === "queue") setActiveSection("queue");
        }}
      />
      <NotificationsPanel
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
      />

      <div className="mx-auto grid max-w-[1540px] gap-6 lg:grid-cols-[124px_minmax(0,1fr)] xl:gap-8">
        <Sidebar theme={theme} toggleTheme={toggleTheme} activeSection={activeSection} onChange={setActiveSection} />

        <div className="space-y-6 xl:space-y-8">
          <HeaderBar
            session={session}
            dashboard={dashboard}
            notificationCount={notifications.length}
            onOpenCommand={() => setCommandOpen(true)}
            onOpenBooking={() => setBookingOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onLogout={onLogout}
          />

          {activeSection === "overview" ? (
            <OverviewView
              session={session}
              topCards={topCards}
              notifications={notifications.slice(0, 3)}
              queue={queue}
              dashboard={dashboard}
              onOpenBooking={() => setBookingOpen(true)}
              onOpenCommand={() => setCommandOpen(true)}
              onOpenSection={setActiveSection}
            />
          ) : null}

          {activeSection === "schedule" ? (
            <ScheduleView
              session={session}
              appointments={dashboard.todaySchedule}
              queue={queue}
              idleInsights={dashboard.idleInsights}
              onMarkComplete={markComplete}
              onCancel={cancel}
              onSmartMove={smartReschedule}
            />
          ) : null}

          {activeSection === "queue" ? <QueueView queue={queue} /> : null}
          {activeSection === "insights" ? <InsightsView dashboard={dashboard} /> : null}
          {activeSection === "analytics" ? (
            <AnalyticsView
              utilizationRate={utilizationRate}
              dashboard={dashboard}
              queue={queue}
              weeklyEfficiency={weeklyEfficiency}
              patientsPerHour={patientsPerHour}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  theme,
  toggleTheme,
  activeSection,
  onChange
}: {
  theme: "light" | "dark";
  toggleTheme: () => void;
  activeSection: SectionId;
  onChange: (section: SectionId) => void;
}) {
  return (
    <Card className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col items-center gap-6 overflow-hidden border border-white/70 bg-gradient-to-b from-emerald-50/95 via-sky-50/95 to-white/95 p-4 text-slate-950 shadow-[0_25px_70px_rgba(14,165,233,0.12)] dark:border-white/10 dark:bg-slate-950/92 dark:text-white dark:shadow-[0_30px_80px_rgba(2,6,23,0.28)]">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-300/12 via-transparent to-sky-300/12 dark:from-sky-500/8 dark:to-transparent" />
      <div className="relative">
        <ClinicFlowLogo compact />
      </div>
      <div className="relative mt-1 flex w-full flex-col gap-2.5">
        {menu.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group flex flex-col items-center gap-2 rounded-[22px] px-2 py-3 transition-all duration-200 ${
                isActive
                  ? "bg-slate-950 text-white shadow-glass dark:bg-white/12 dark:text-white"
                  : "text-slate-500 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="relative mt-auto w-full rounded-[22px] border border-slate-200 bg-slate-950 p-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-slate-950/96">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Mode</div>
        <button
          onClick={toggleTheme}
          className="mt-2 flex w-full items-center justify-between rounded-2xl bg-white/8 px-3 py-2 text-sm font-semibold transition hover:bg-white/12"
        >
          <span>{theme === "dark" ? "Dark" : "Bright"}</span>
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
      </div>
    </Card>
  );
}

function HeaderBar({
  session,
  dashboard,
  notificationCount,
  onOpenCommand,
  onOpenBooking,
  onOpenNotifications,
  onLogout
}: {
  session: Session;
  dashboard: DashboardData;
  notificationCount: number;
  onOpenCommand: () => void;
  onOpenBooking: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}) {
  return (
    <Card className="overflow-hidden border border-white/70 bg-gradient-to-r from-white/96 via-sky-50/88 to-emerald-50/82 p-0 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/92">
      <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/6 via-transparent to-emerald-400/8 dark:from-sky-500/8 dark:to-teal-500/10" />
        <div className="relative">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {session.user.role === "doctor" ? "Doctor Dashboard" : "Receptionist Dashboard"}
          </div>
          <CardTitle className="mt-1 text-4xl leading-tight text-slate-950 dark:text-white">
            Welcome back, {session.user.role === "doctor" ? dashboard.doctor.name : session.user.name}
          </CardTitle>
          <CardDescription className="mt-3 text-base text-slate-600 dark:text-slate-400">
            {dashboard.doctor.name} • {dashboard.doctor.specialization ?? "Clinic operations"} • {todayIsoDate()}
          </CardDescription>
        </div>
        <div className="relative flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={onOpenCommand} className="hover:-translate-y-0.5">
            <Command className="mr-2 h-4 w-4" />
            Command Center
          </Button>
          <button
            onClick={onOpenNotifications}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
          >
            <Bell className="h-5 w-5" />
            {notificationCount ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
          </button>
          {session.user.role === "receptionist" ? (
            <Button onClick={onOpenBooking} className="hover:-translate-y-0.5">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onLogout} className="hover:-translate-y-0.5 dark:text-white dark:hover:bg-white/8 dark:hover:text-white">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OverviewView({
  session,
  topCards,
  notifications,
  queue,
  dashboard,
  onOpenBooking,
  onOpenCommand,
  onOpenSection
}: {
  session: Session;
  topCards: Array<{ label: string; value: string; detail: string; icon: React.ComponentType<{ className?: string }>; accent: string }>;
  notifications: Array<{ id: string; title: string; description: string; accent: string; time: string }>;
  queue: QueueData;
  dashboard: DashboardData;
  onOpenBooking: () => void;
  onOpenCommand: () => void;
  onOpenSection: (section: SectionId) => void;
}) {
  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} icon={item.icon} accent={item.accent} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard className="p-6">
          <SectionPill icon={Sparkles} tone="sky">Clinic snapshot</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">Run the clinic from one workspace</CardTitle>
          <CardDescription className="mt-2 text-slate-600 dark:text-slate-400">
            Reception can book, reschedule, and recover slots while doctors stay aligned with the live queue.
          </CardDescription>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <ActionCard title="Book appointment" description="Open the booking modal with smart slot suggestions." icon={CalendarPlus} onClick={onOpenBooking} />
            <ActionCard title="Open command center" description="Trigger search-driven actions with Ctrl + K." icon={Command} onClick={onOpenCommand} />
            <ActionCard title="View live queue" description="Open the large clinic display mode for waiting patients." icon={Monitor} onClick={() => onOpenSection("queue")} />
            <ActionCard title="Open analytics" description="Jump into charts and performance trends." icon={ChartColumn} onClick={() => onOpenSection("analytics")} />
          </div>
        </PanelCard>

        <PanelCard className="p-6">
          <SectionPill icon={Bell} tone="violet">Notifications</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">Today’s activity feed</CardTitle>
          <div className="mt-5 space-y-3">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard className="p-6">
          <SectionPill icon={ClipboardList} tone="teal">Schedule preview</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">What’s happening next</CardTitle>
          <div className="mt-5 space-y-3">
            {dashboard.todaySchedule.slice(0, 4).map((appointment) => (
              <div
                key={appointment._id}
                className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-950 dark:text-white">{appointment.patientName}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {formatTime(appointment.time)} • {appointment.appointmentType}
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard className="p-6">
          <SectionPill icon={Users} tone="amber">Queue pulse</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">Live queue summary</CardTitle>
          <div className="mt-5 space-y-3">
            <QueueMiniCard label="Now Serving" value={queue.nowServing?.patientName ?? "No active patient"} />
            <QueueMiniCard label="Next Patient" value={queue.nextPatient?.patientName ?? "Queue clear"} />
            <QueueMiniCard label="Waiting Count" value={String(queue.waitingCount)} strong />
          </div>
          {session.user.role === "receptionist" ? (
            <Button className="mt-5 w-full hover:-translate-y-0.5" variant="secondary" onClick={onOpenBooking}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add another booking
            </Button>
          ) : null}
        </PanelCard>
      </div>
    </div>
  );
}

function ScheduleView({
  session,
  appointments,
  queue,
  idleInsights,
  onMarkComplete,
  onCancel,
  onSmartMove
}: {
  session: Session;
  appointments: Appointment[];
  queue: QueueData;
  idleInsights: Array<{ title: string; actions: string[] }>;
  onMarkComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onSmartMove: (id: string, type: "consultation" | "follow-up" | "emergency", date: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <PanelCard className="p-6 xl:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionPill icon={Activity} tone="sky">Daily timeline</SectionPill>
            <CardTitle className="mt-4 text-slate-950 dark:text-white">Live clinic schedule</CardTitle>
            <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">
              Today&apos;s schedule with status-aware patient movement and quick actions.
            </CardDescription>
          </div>
          <Badge className="bg-slate-950 text-white dark:bg-white/10 dark:text-white">Live schedule</Badge>
        </div>
        <div className="mt-6 space-y-4">
          {appointments.map((appointment, index) => (
            <motion.div
              key={appointment._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-white/82 p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-semibold text-slate-500 dark:text-slate-400">{formatTime(appointment.time)}</div>
                <div>
                  <div className="font-semibold text-slate-950 dark:text-white">{appointment.patientName}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {appointment.appointmentType} • {appointment.duration} min
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <StatusBadge status={appointment.status} />
                {session.user.role === "doctor" && appointment.status !== "completed" ? (
                  <Button size="sm" variant="secondary" onClick={() => onMarkComplete(appointment._id)} className="hover:-translate-y-0.5">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark completed
                  </Button>
                ) : null}
                {session.user.role === "receptionist" && appointment.status !== "cancelled" ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSmartMove(appointment._id, appointment.appointmentType, appointment.date)}
                      className="hover:-translate-y-0.5"
                    >
                      <Syringe className="mr-2 h-4 w-4" />
                      Smart move
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onCancel(appointment._id)} className="hover:-translate-y-0.5 dark:text-white dark:hover:bg-white/8 dark:hover:text-white">
                      <CalendarX2 className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </PanelCard>

      <div className="space-y-6">
        <PanelCard className="p-6">
          <SectionPill icon={Users} tone="violet">Queue</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">Queue management</CardTitle>
          <div className="mt-5 grid gap-4">
            <QueueMiniCard label="Now Serving" value={queue.nowServing?.patientName ?? "No active patient"} />
            <QueueMiniCard label="Next Patient" value={queue.nextPatient?.patientName ?? "Queue clear"} />
            <QueueMiniCard label="Waiting Count" value={String(queue.waitingCount)} strong />
          </div>
        </PanelCard>

        <PanelCard className="p-6">
          <SectionPill icon={Sparkles} tone="emerald">Doctor idle time</SectionPill>
          <CardTitle className="mt-4 text-slate-950 dark:text-white">Doctor Idle Time Intelligence</CardTitle>
          <div className="mt-5 space-y-3">
            {idleInsights.map((insight) => (
              <div
                key={insight.title}
                className="rounded-[24px] border border-emerald-300/35 bg-gradient-to-r from-emerald-50 to-sky-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:from-emerald-100 hover:to-sky-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/14"
              >
                <div className="font-semibold text-slate-950 dark:text-white">{insight.title}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{insight.actions.join(" • ")}</div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function QueueView({ queue }: { queue: QueueData }) {
  return (
    <PanelCard className="px-8 py-10 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-3 text-center">
          <Monitor className="h-8 w-8 text-cyan-400" />
          <CardTitle className="text-5xl text-slate-950 dark:text-white md:text-6xl">Live Clinic Queue</CardTitle>
        </div>
        <div className="mt-10 space-y-8">
          <div className="rounded-[34px] border border-cyan-300/35 bg-gradient-to-r from-white via-sky-50 to-emerald-50 p-8 text-center shadow-[0_0_60px_rgba(34,211,238,0.14)] transition duration-200 hover:-translate-y-1 dark:border-cyan-400/20 dark:bg-slate-950/95">
            <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Now Serving</div>
            <div className="mt-5 text-5xl font-semibold text-cyan-600 dark:text-cyan-300 md:text-7xl">
              {queue.nowServing?.patientName ?? "No active patient"}
            </div>
            <div className="mt-3 text-xl text-slate-600 dark:text-slate-400">
              {queue.nowServing ? `${queue.nowServing.appointmentType} • ${formatTime(queue.nowServing.time)}` : "Queue is clear"}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-8 text-center transition duration-200 hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-slate-950/88 dark:hover:bg-slate-950/96">
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Next Patient</div>
              <div className="mt-5 text-4xl font-semibold text-slate-950 dark:text-white md:text-5xl">
                {queue.nextPatient?.patientName ?? "Queue clear"}
              </div>
              <div className="mt-3 text-lg text-slate-600 dark:text-slate-400">
                {queue.nextPatient ? `${queue.nextPatient.appointmentType} • ${formatTime(queue.nextPatient.time)}` : "No upcoming patient"}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-8 text-center transition duration-200 hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-slate-950/88 dark:hover:bg-slate-950/96">
              <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Waiting</div>
              <div className="mt-5 text-6xl font-semibold text-amber-500 dark:text-amber-300 md:text-7xl">{queue.waitingCount}</div>
              <div className="mt-3 text-lg text-slate-600 dark:text-slate-400">patients in queue</div>
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function InsightsView({ dashboard }: { dashboard: DashboardData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <PanelCard className="p-6">
        <SectionPill icon={UserRound} tone="amber">Waitlist</SectionPill>
        <CardTitle className="mt-4 text-slate-950 dark:text-white">Waitlist recovery</CardTitle>
        <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">Suggested patients when a slot opens up.</CardDescription>
        <div className="mt-5 space-y-3">
          {dashboard.waitlist.map((entry) => (
            <div
              key={entry._id}
              className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-950 dark:text-white">{entry.patientName}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{entry.appointmentType}</div>
                </div>
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Urgency {entry.urgency}</Badge>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard className="p-6">
        <SectionPill icon={TrendingUp} tone="fuchsia">Optimizer</SectionPill>
        <CardTitle className="mt-4 text-slate-950 dark:text-white">AI Smart Day Optimizer</CardTitle>
        <CardDescription className="mt-1 text-slate-600 dark:text-slate-400">Efficiency scoring across idle time, overbook risk, and balance.</CardDescription>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Efficiency" value={`${dashboard.efficiency.efficiencyScore}%`} />
          <Metric label="Idle Minutes" value={String(dashboard.efficiency.metrics.idleMinutes)} />
          <Metric label="Balanced" value={`${dashboard.efficiency.metrics.balancedSchedule}%`} />
        </div>
        <div className="mt-6 rounded-[28px] border border-slate-200/70 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
            <Bell className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            Optimization suggestions
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
            {dashboard.efficiency.suggestions.map((suggestion) => (
              <div key={suggestion}>• {suggestion}</div>
            ))}
          </div>
        </div>
      </PanelCard>
    </div>
  );
}

function AnalyticsView({
  utilizationRate,
  dashboard,
  queue,
  weeklyEfficiency,
  patientsPerHour
}: {
  utilizationRate: number;
  dashboard: DashboardData;
  queue: QueueData;
  weeklyEfficiency: Array<{ day: string; efficiency: number }>;
  patientsPerHour: Array<{ hour: string; patients: number }>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Utilization" value={`${utilizationRate}%`} />
        <Metric label="Overbook Risk" value={`${dashboard.efficiency.metrics.overbookRisk}`} />
        <Metric label="Waiting Queue" value={`${queue.waitingCount}`} />
      </div>

      <PanelCard className="p-6">
        <SectionPill icon={ChartColumn} tone="sky">Analytics</SectionPill>
        <CardTitle className="mt-4 text-slate-950 dark:text-white">Weekly Efficiency</CardTitle>
        <div className="mt-6 h-[360px] rounded-[30px] border border-slate-200/70 bg-white/82 p-5 dark:border-white/10 dark:bg-white/[0.03]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyEfficiency} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgb(100 116 139)", fontSize: 14 }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fill: "rgb(100 116 139)", fontSize: 14 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip labelSuffix="efficiency" />} />
              <Line type="monotone" dataKey="efficiency" stroke="#22d3ee" strokeWidth={4} dot={{ r: 7, fill: "#22d3ee" }} activeDot={{ r: 9, fill: "#22d3ee" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard className="p-6">
          <CardTitle className="text-slate-950 dark:text-white">Patients Per Hour</CardTitle>
          <div className="mt-6 h-[340px] rounded-[30px] border border-slate-200/70 bg-white/82 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientsPerHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "rgb(100 116 139)", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgb(100 116 139)", fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip labelSuffix="patients" />} cursor={{ fill: "rgba(56,189,248,0.10)" }} />
                <Bar dataKey="patients" fill="#3b82f6" radius={[18, 18, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard className="p-6">
          <CardTitle className="text-slate-950 dark:text-white">Optimization Suggestions</CardTitle>
          <div className="mt-6 space-y-4">
            {dashboard.efficiency.suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-cyan-500/12 p-2 text-cyan-600 dark:text-cyan-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function NotificationsPanel({
  open,
  onOpenChange,
  notifications
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Array<{ id: string; title: string; description: string; accent: string; time: string }>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] bg-slate-950/18 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="absolute right-4 top-4 h-[calc(100vh-2rem)] w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/96 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Notifications</div>
            <div className="mt-2 text-2xl font-semibold text-white">Activity stream</div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/8 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 space-y-3 overflow-y-auto pr-1">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} darkOnly />
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`border border-white/70 bg-gradient-to-br from-white/96 via-sky-50/88 to-emerald-50/82 text-slate-950 shadow-[0_24px_70px_rgba(14,165,233,0.08)] dark:border-white/10 dark:bg-slate-950/92 dark:text-white dark:shadow-[0_30px_80px_rgba(2,6,23,0.28)] ${className ?? ""}`}>
      {children}
    </Card>
  );
}

function SectionPill({
  icon: Icon,
  tone,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "sky" | "violet" | "emerald" | "amber" | "teal" | "fuchsia";
  children: React.ReactNode;
}) {
  const tones = {
    sky: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    violet: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
    emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
    teal: "bg-teal-500/12 text-teal-600 dark:text-teal-300",
    fuchsia: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300"
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tones[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  onClick
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[24px] border border-slate-200/70 bg-white/82 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
    >
      <div className="w-fit rounded-2xl bg-sky-500/12 p-2 text-sky-600 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 font-semibold text-slate-950 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</div>
    </button>
  );
}

function QueueMiniCard({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-[24px] border p-4 transition duration-200 hover:-translate-y-0.5 ${strong ? "border-slate-950 bg-slate-950 text-white dark:border-white/10 dark:bg-slate-950" : "border-slate-200/70 bg-white/82 text-slate-950 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.05]"}`}>
      <div className={`text-sm ${strong ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}

function NotificationItem({
  notification,
  darkOnly = false
}: {
  notification: { id: string; title: string; description: string; accent: string; time: string };
  darkOnly?: boolean;
}) {
  return (
    <div className={`rounded-[22px] border p-4 transition duration-200 hover:-translate-y-0.5 ${darkOnly ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]" : "border-slate-200/70 bg-white/82 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`font-semibold ${darkOnly ? "text-white" : "text-slate-950 dark:text-white"}`}>{notification.title}</div>
          <div className={`mt-1 text-sm ${darkOnly ? "text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>{notification.description}</div>
        </div>
        <Badge className={accentBadge(notification.accent)}>{notification.time}</Badge>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const accents: Record<string, string> = {
    cyan: "from-sky-50 via-white to-cyan-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950",
    emerald: "from-emerald-50 via-white to-lime-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950",
    teal: "from-teal-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950",
    amber: "from-amber-50 via-white to-orange-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950",
    violet: "from-violet-50 via-white to-fuchsia-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
  };

  return (
    <Card className={`overflow-hidden border border-white/70 bg-gradient-to-br ${accents[accent]} p-5 shadow-[0_24px_70px_rgba(14,165,233,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(14,165,233,0.14)] dark:border-white/10 dark:shadow-[0_30px_80px_rgba(2,6,23,0.28)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-4 font-display text-4xl font-semibold text-slate-950 dark:text-white">{value}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{detail}</div>
        </div>
        <div className="rounded-2xl bg-white/85 p-3 text-sky-600 shadow-sm dark:bg-white/8 dark:text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({
  status
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    waiting: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300"
  };

  return <Badge className={styles[status] ?? "bg-slate-500/10 text-slate-600 dark:text-slate-300"}>{status}</Badge>;
}

function Metric({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/82 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  labelSuffix
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  labelSuffix: string;
}) {
  const { theme } = useTheme();

  if (!active || !payload?.length) return null;

  return (
    <div className={`rounded-[20px] border px-4 py-3 shadow-glass ${theme === "dark" ? "border-white/10 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-950"}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className={`mt-1 text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`}>
        {`${labelSuffix} : ${payload[0]?.value ?? 0}`}
      </div>
    </div>
  );
}

function accentBadge(accent: string) {
  switch (accent) {
    case "sky":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "emerald":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "amber":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "violet":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-300";
  }
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
  const filteredActions = actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/28 p-6 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div
        className="mt-20 w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/96 p-4 shadow-glass backdrop-blur-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a command..."
          className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50"
        />
        <div className="mt-4 space-y-2">
          {filteredActions.map((action, index) => (
            <button
              key={`${action.id}-${index}`}
              onClick={() => {
                onAction(action.id);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left text-slate-200 transition hover:bg-cyan-500/18 hover:text-white"
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
