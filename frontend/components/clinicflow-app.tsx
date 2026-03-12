"use client";

import * as React from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthModal } from "@/components/modals/auth-modal";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { getStoredSession, setStoredSession } from "@/lib/storage";
import type { Session } from "@/lib/types";

function AppInner() {
  const { push } = useToast();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    setSession(getStoredSession());
  }, []);

  function handleAuthenticated(nextSession: Session) {
    setStoredSession(nextSession);
    setSession(nextSession);
    push({
      title: "You are signed in",
      description: `${nextSession.user.role === "doctor" ? "Doctor" : "Receptionist"} workspace is ready.`
    });
  }

  function handleLogout() {
    setStoredSession(null);
    setSession(null);
    push({ title: "Logged out", description: "Session cleared from this browser." });
  }

  return (
    <>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={handleAuthenticated} />
      {session ? <DashboardShell session={session} onLogout={handleLogout} /> : <LandingPage onGetStarted={() => setAuthOpen(true)} />}
    </>
  );
}

export function ClinicFlowApp() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
