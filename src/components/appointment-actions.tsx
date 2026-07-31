"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status !== "PENDING") return null;

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => updateStatus("CONFIRMED")}
        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">
          check_circle
        </span>
        Confirm
      </button>
      <button
        disabled={loading}
        onClick={() => updateStatus("CANCELLED")}
        className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
