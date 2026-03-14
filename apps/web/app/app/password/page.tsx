"use client";

import { useState, FormEvent } from "react";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

export default function PasswordResetPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          This feature is not available.
        </div>
      </main>
    );
  }

  const [email, setEmail] = useState("tenant@demo.health");
  const [password, setPassword] = useState("Password123!");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok) {
        const raw = json?.error?.message ?? json?.error ?? "Request failed.";
        setError(getUserFacingMessage(typeof raw === "string" ? new Error(raw) : raw, "password"));
      } else {
        setMessage("Password reset. You can now sign in with these credentials.");
      }
    } catch (err) {
      setError(getUserFacingMessage(err, "password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <div className="space-y-6 rounded-[28px] border border-slate-200/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Administrator only
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Reset password</h1>
          <p className="text-sm leading-6 text-slate-600">
            Resets a user’s password. Do not expose this page in production.
          </p>
        </div>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">New password</span>
            <input
              className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
            />
          </label>
          <button
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
