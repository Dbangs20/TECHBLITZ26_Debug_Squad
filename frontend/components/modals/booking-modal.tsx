"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToWaitlist, createAppointment, fetchSmartSlots } from "@/lib/api";
import type { AppointmentType } from "@/lib/types";
import { formatTime, todayIsoDate } from "@/lib/utils";

export function BookingModal({
  open,
  onOpenChange,
  token,
  doctorId,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  doctorId: string;
  onSuccess: (message: string) => void;
}) {
  const [form, setForm] = React.useState({
    patientName: "",
    date: todayIsoDate(),
    time: "10:20",
    appointmentType: "consultation" as AppointmentType,
    urgency: 2,
    notes: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [smartSlots, setSmartSlots] = React.useState<string[]>([]);
  const [optimalSlot, setOptimalSlot] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    fetchSmartSlots(token, doctorId, form.appointmentType, form.date)
      .then((result) => {
        setSmartSlots(result.suggestions);
        setOptimalSlot(result.optimalSlot ? `${formatTime(result.optimalSlot.start)} - ${formatTime(result.optimalSlot.end)}` : null);
      })
      .catch(() => {
        setSmartSlots([]);
        setOptimalSlot(null);
      });
  }, [doctorId, form.appointmentType, form.date, open, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      await createAppointment(token, { ...form, doctorId });
      onSuccess("Appointment booked successfully");
      onOpenChange(false);
      setForm({
        patientName: "",
        date: todayIsoDate(),
        time: "10:20",
        appointmentType: "consultation",
        urgency: 2,
        notes: ""
      });
    } catch (error) {
      onSuccess(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitlist() {
    try {
      await addToWaitlist(token, {
        patientName: form.patientName,
        doctorId,
        preferredDate: form.date,
        appointmentType: form.appointmentType,
        urgency: form.urgency
      });
      onSuccess("Patient added to waitlist");
      onOpenChange(false);
    } catch (error) {
      onSuccess(error instanceof Error ? error.message : "Waitlist request failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <div className="font-display text-3xl font-semibold text-slate-950">Book appointment</div>
          <p className="mt-2 text-sm text-slate-500">Conflict-safe scheduling with smart slot suggestions.</p>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="patientName">Patient name</Label>
            <Input id="patientName" value={form.patientName} onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input id="time" type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Appointment type</Label>
            <div className="grid gap-2">
              {(["consultation", "follow-up", "emergency"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, appointmentType: type }))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    form.appointmentType === type
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-white/70 bg-white/60 text-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Smart slot suggestion</div>
              <div className="mt-1 text-sm text-slate-600">
                {optimalSlot ?? "No optimized gap detected yet."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, time: slot }))}
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="urgency">Waitlist urgency (1-5)</Label>
            <Input
              id="urgency"
              type="number"
              min={1}
              max={5}
              value={form.urgency}
              onChange={(event) => setForm((current) => ({ ...current, urgency: Number(event.target.value) || 1 }))}
            />
          </div>
          <div className="md:col-span-2">
            <div className="grid gap-3 md:grid-cols-2">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Booking..." : "Confirm Appointment"}
              </Button>
              <Button className="w-full" type="button" variant="secondary" onClick={handleWaitlist}>
                Join Waitlist Instead
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
