"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToWaitlist, createAppointment, fetchSmartSlots } from "@/lib/api";
import type { AppointmentType } from "@/lib/types";
import { buildAppointmentWhatsAppMessage, buildWhatsAppLink, formatTime, todayIsoDate } from "@/lib/utils";

export function BookingModal({
  open,
  onOpenChange,
  token,
  doctorId,
  initialValues,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  doctorId: string;
  initialValues?: Partial<{
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    appointmentType: AppointmentType;
    notes: string;
  }> | null;
  onSuccess: (message: string) => Promise<void> | void;
}) {
  const [form, setForm] = React.useState({
    patientName: "",
    patientPhone: "",
    date: todayIsoDate(),
    time: "10:20",
    appointmentType: "consultation" as AppointmentType,
    urgency: 2,
    notes: "",
    sendWhatsApp: true
  });
  const [loading, setLoading] = React.useState(false);
  const [smartSlots, setSmartSlots] = React.useState<string[]>([]);
  const [optimalSlot, setOptimalSlot] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (!initialValues) return;

    setForm((current) => ({
      ...current,
      patientName: initialValues.patientName ?? current.patientName,
      patientPhone: initialValues.patientPhone ?? current.patientPhone,
      date: initialValues.date ?? current.date,
      time: initialValues.time ?? current.time,
      appointmentType: initialValues.appointmentType ?? current.appointmentType,
      notes: initialValues.notes ?? current.notes
    }));
  }, [initialValues, open]);

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
      const appointment = await createAppointment(token, { ...form, doctorId });
      if (form.sendWhatsApp && form.patientPhone) {
        const message = buildAppointmentWhatsAppMessage({
          patientName: form.patientName,
          doctorName: "Dr. Aisha Patel",
          date: form.date,
          time: appointment.time ?? form.time,
          appointmentType: form.appointmentType
        });
        window.open(buildWhatsAppLink(form.patientPhone, message), "_blank", "noopener,noreferrer");
      }
      await onSuccess("Appointment booked successfully");
      onOpenChange(false);
      setForm({
        patientName: "",
        patientPhone: "",
        date: todayIsoDate(),
        time: "10:20",
        appointmentType: "consultation",
        urgency: 2,
        notes: "",
        sendWhatsApp: true
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
      await onSuccess("Patient added to waitlist");
      onOpenChange(false);
    } catch (error) {
      await onSuccess(error instanceof Error ? error.message : "Waitlist request failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <div className="font-display text-3xl font-semibold text-slate-950 dark:text-slate-50">
            {initialValues?.appointmentType === "follow-up" ? "Pre-book follow-up" : "Book appointment"}
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Conflict-safe scheduling with smart slot suggestions.</p>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="patientName">Patient name</Label>
            <Input id="patientName" value={form.patientName} onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="patientPhone">WhatsApp number</Label>
            <Input
              id="patientPhone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.patientPhone}
              onChange={(event) => setForm((current) => ({ ...current, patientPhone: event.target.value }))}
            />
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
                      : "border-white/70 bg-white/60 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Smart slot suggestion</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {optimalSlot ?? "No optimized gap detected yet."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, time: slot }))}
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700"
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
          <div className="space-y-3 rounded-[24px] border border-white/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">WhatsApp confirmation</div>
            <label className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>Send autogenerated confirmation after booking</span>
              <input
                type="checkbox"
                checked={form.sendWhatsApp}
                onChange={(event) => setForm((current) => ({ ...current, sendWhatsApp: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Opens WhatsApp Web or the WhatsApp app with a prefilled appointment confirmation message.
            </div>
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
