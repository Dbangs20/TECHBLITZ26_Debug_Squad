import type { ReactNode } from "react";
import { ArrowRight, CalendarClock, Command, Sparkles, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ClinicFlowLogo } from "./logo";

export function LandingPage({
  onGetStarted
}: {
  onGetStarted: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative overflow-hidden px-6 pb-12 pt-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <ClinicFlowLogo />
          <Button variant="secondary" onClick={onGetStarted}>
            Login / Signup
          </Button>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Schedule smarter, not harder
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-6xl">
              Keep every doctor’s day flowing with fewer gaps, fewer clashes, and better patient movement.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              ClinicFlow gives reception teams and doctors one shared system for booking, rescheduling,
              queue control, waitlist recovery, and real-time schedule optimization.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={onGetStarted}>
                Start ClinicFlow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="rounded-full border border-white/70 bg-white/60 px-5 py-3 text-sm text-slate-600 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 dark:text-slate-300">
                Built for clinics, consultation centers, and doctor-led practices
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute -right-10 bottom-4 h-36 w-36 rounded-full bg-sky-300/30 blur-3xl" />
            <Card className={`relative space-y-6 p-7 ${isDark ? "border-white/10 bg-slate-950/92" : ""}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <MiniMetric label="Appointments today" value="18" icon={<CalendarClock className="h-4 w-4" />} />
                <MiniMetric label="Patients waiting" value="4" icon={<Stethoscope className="h-4 w-4" />} />
              </div>
              <div className="rounded-[24px] border border-white/70 bg-slate-950 px-5 py-4 text-white dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">Command Center</div>
                    <div className="mt-1 text-lg font-semibold">Ctrl + K for instant actions</div>
                  </div>
                  <Command className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div>Book appointment</div>
                  <div>Open waitlist</div>
                  <div>View doctor dashboard</div>
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">AI Smart Day Optimizer</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">Efficiency 87%</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Fill 2:30 PM gap and move one later patient forward.</div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="Conflict-proof booking"
            description="Double booking prevention with next-slot suggestions built into every appointment action."
          />
          <FeatureCard
            title="Doctor-first schedule view"
            description="Timeline dashboard with next patient, waiting patients, queue updates, and daily health score."
          />
          <FeatureCard
            title="Waitlist recovery"
            description="When cancellations happen, ClinicFlow surfaces the best waitlist candidates immediately."
          />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <div className="mt-4 font-display text-4xl font-semibold text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

function FeatureCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2 leading-7">{description}</CardDescription>
    </Card>
  );
}
