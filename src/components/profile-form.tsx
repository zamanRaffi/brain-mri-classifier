"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

// Reusable card + input styles as plain Tailwind (no custom theme keys needed)
const CARD =
  "bg-surface rounded-2xl p-6 border border-[#F1F5F9] shadow-[0px_4px_20px_rgba(0,74,198,0.05)]";
const INPUT =
  "w-full h-10 px-3 rounded-lg border border-[#F1F5F9] bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const LABEL = "text-xs font-medium tracking-wide text-on-surface-variant block mb-1.5";

export default function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();

  // --- Fields that actually exist in the DB / API ---
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [specialization, setSpecialization] = useState(initial.specialization ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");

  // --- UI-only fields from the design that don't have a backend column
  //     yet. They're wired to local state so the screen looks and behaves
  //     like the design, but are NOT sent to /api/profile. ---
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Profile picture ---
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Password change ---
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const isDoctor = initial.specialization !== undefined;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload picture.");
      }
      setAvatarUrl(data.avatarUrl);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload picture.");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleAvatarDelete() {
    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to remove picture.");
      }
      setAvatarUrl(null);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove picture.");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handlePasswordUpdate() {
    setPasswordError(null);
    setPasswordSaved(false);

    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, specialization, bio }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  function handleCancel() {
    setName(initial.name);
    setPhone(initial.phone ?? "");
    setSpecialization(initial.specialization ?? "");
    setBio(initial.bio ?? "");
    setSaved(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface leading-tight">
            {name || "Your name"}
          </h2>
          <p className="text-base text-on-surface-variant mt-1">
            {isDoctor ? "Doctor account" : "Patient account"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 h-10 rounded-lg border border-[#F1F5F9] text-on-surface-variant text-sm font-semibold hover:bg-surface-variant transition-colors bg-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 h-10 rounded-lg bg-tertiary-container text-on-tertiary-container text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {saved && <p className="text-sm text-tertiary -mt-4">Changes saved</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: avatar + clinical info */}
        <div className="flex flex-col gap-6">
          {/* Avatar card */}
          <div className={`${CARD} flex flex-col items-center text-center`}>
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container shadow-sm bg-primary-fixed flex items-center justify-center text-primary text-4xl font-semibold">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${name || "Profile"} picture`}
                    className="w-full h-full object-cover"
                  />
                ) : name ? (
                  name.charAt(0).toUpperCase()
                ) : (
                  "?"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary border-2 border-surface hover:bg-surface-tint transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              {name || "Your name"}
            </h3>
            <div className="flex gap-2 w-full mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="flex-1 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50"
              >
                {avatarLoading ? "Uploading..." : "Upload Picture"}
              </button>
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={avatarLoading || !avatarUrl}
                className="px-3 py-2 rounded-lg border border-[#F1F5F9] text-error hover:bg-error-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
            {avatarError && (
              <p className="text-xs text-error mt-2">{avatarError}</p>
            )}
          </div>

          {/* Clinical Details card — doctors only, wired to real fields */}
          {isDoctor && (
            <div className={CARD}>
              <h3 className="text-base font-semibold text-on-surface flex items-center gap-2 mb-4 border-b border-[#F1F5F9] pb-2">
                <span className="material-symbols-outlined text-tertiary-container">
                  medical_services
                </span>
                Clinical Profile
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={LABEL}>Specialization</label>
                  <input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Neurologist"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className={`${INPUT} h-auto py-2.5 resize-none`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: personal info, security, preferences */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          {/* Personal Information */}
          <div className={CARD}>
            <h3 className="text-base font-semibold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    mail
                  </span>
                  <input
                    value={initial.email}
                    disabled
                    className={`${INPUT} pl-10 bg-surface-container text-on-surface-variant`}
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={LABEL}>Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    phone
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${INPUT} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className={CARD}>
            <h3 className="text-base font-semibold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shield</span>
              Security Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className={LABEL}>Current Password</label>
                <input
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordSaved(false);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  type="password"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>New Password</label>
                <input
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordSaved(false);
                    setPasswordError(null);
                  }}
                  placeholder="New Password"
                  type="password"
                  className={INPUT}
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 mt-2">
                {passwordSaved && (
                  <p className="text-sm text-tertiary">Password updated</p>
                )}
                {passwordError && (
                  <p className="text-sm text-error">{passwordError}</p>
                )}
                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading}
                  className="px-4 h-10 rounded-lg bg-surface-variant text-on-surface text-sm font-semibold hover:bg-surface-dim transition-colors border border-[#F1F5F9] disabled:opacity-50"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>

          {/* Preferences & Privacy */}
          <div className={CARD}>
            <h3 className="text-base font-semibold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Preferences &amp; Privacy
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                <div>
                  <h4 className="text-base font-semibold text-on-surface">
                    Email Notifications
                  </h4>
                  <p className="text-sm text-on-surface-variant">
                    Receive appointment reminders and scan results via email.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                <div>
                  <h4 className="text-base font-semibold text-on-surface">SMS Alerts</h4>
                  <p className="text-sm text-on-surface-variant">
                    Get critical alerts directly to your registered phone number.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}