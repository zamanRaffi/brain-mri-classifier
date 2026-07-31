"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, specialization }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "কিছু একটা সমস্যা হয়েছে");
      setLoading(false);
      return;
    }

    // Auto-login after signup
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    router.push(role === "PATIENT" ? "/patient/dashboard" : "/doctor/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-outline-variant p-1 bg-surface-container-lowest">
        <button
          type="button"
          onClick={() => setRole("PATIENT")}
          className={`py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            role === "PATIENT"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            person
          </span>
          Patient
        </button>
        <button
          type="button"
          onClick={() => setRole("DOCTOR")}
          className={`py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            role === "DOCTOR"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            stethoscope
          </span>
          Doctor
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium text-on-surface-variant">
          Full Name
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
            badge
          </span>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-on-surface-variant">
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
            mail
          </span>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-on-surface-variant">
          Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
            lock
          </span>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {role === "DOCTOR" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="specialization" className="text-xs font-medium text-on-surface-variant">
            Specialization
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
              medical_services
            </span>
            <input
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Neurologist"
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 h-11 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "..." : "Create Account"}
        {!loading && (
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        )}
      </button>
    </form>
  );
}
