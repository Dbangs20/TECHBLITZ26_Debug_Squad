"use client";

import * as React from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/lib/api";
import type { Session } from "@/lib/types";
import { useTheme } from "@/components/theme-provider";

export function AuthModal({
  open,
  onOpenChange,
  onAuthenticated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: (session: Session) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mode, setMode] = React.useState<"login" | "signup">("signup");
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist" as "doctor" | "receptionist",
    specialization: ""
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const session =
        mode === "signup"
          ? await signup(form)
          : await login({ email: form.email, password: form.password });
      onAuthenticated(session);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-md ${isDark ? "border-white/10 bg-slate-950/96" : "border-slate-200 bg-white/96"}`}>
        <div>
          <div className="font-display text-3xl font-semibold text-slate-950 dark:text-slate-50">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === "signup" ? "Get started with ClinicFlow" : "Access your clinic dashboard"}
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </div>
          {mode === "signup" ? (
            <>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["receptionist", "doctor"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, role }))}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        form.role === role
                          ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/12 dark:text-sky-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                      }`}
                    >
                      {role === "receptionist" ? "Receptionist" : "Doctor"}
                    </button>
                  ))}
                </div>
              </div>
              {form.role === "doctor" ? (
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={form.specialization}
                    onChange={(event) => setForm((current) => ({ ...current, specialization: event.target.value }))}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-sky-700 dark:text-sky-300"
            onClick={() => setMode((current) => (current === "signup" ? "login" : "signup"))}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
