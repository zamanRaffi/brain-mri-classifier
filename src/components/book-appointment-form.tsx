"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Doctor = {
  id: string;
  name: string;
  specialization: string | null;
};

export default function BookAppointmentForm({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, scheduledAt, reason }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "সমস্যা হয়েছে");
      return;
    }

    setSuccess(true);
    setReason("");
    router.refresh();
  }

  if (doctors.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm">
        No doctors are registered yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            group
          </span>
          Select Specialist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((d) => {
            const isSelected = doctorId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDoctorId(d.id)}
                className={`text-left rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/40 hover:border-primary/50"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold shrink-0">
                  {d.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-on-surface truncate">
                    Dr. {d.name}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {d.specialization ?? "General"}
                  </p>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
          <span className="material-symbols-outlined text-primary">
            edit_calendar
          </span>
          Appointment Details
        </h2>

        <div>
          <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium tracking-wide text-on-surface-variant mb-2">
            Reason for Visit (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Any specific symptoms or questions?"
            rows={3}
            className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
          />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        {success && (
          <p className="text-sm text-tertiary">Appointment successfully booked!</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary text-on-primary h-12 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto px-8"
        >
          <span className="material-symbols-outlined text-[18px]">lock</span>
          {loading ? "..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
