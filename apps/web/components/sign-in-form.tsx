"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@healthscope/auth/browser";
import { getUserFacingMessage } from "../lib/user-error-messages";

type SignInFormProps = {
  enabled: boolean;
};

type Mode = "sign-in" | "sign-up";

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const modeToggleClassName =
  "rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100";

export function SignInForm({ enabled }: SignInFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitDisabled = !enabled || isPending || isSubmitting;
  const disabledReason = !enabled
    ? "Sign-in is not available right now."
    : isPending
      ? "Please wait..."
      : isSubmitting
        ? "Please wait..."
        : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enabled || !supabase) {
      setError(getUserFacingMessage(new Error("Sign-in is not available."), "sign-in"));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(getUserFacingMessage(signInError, "sign-in"));
        setIsSubmitting(false);
        return;
      }

      startTransition(() => {
        router.push("/app");
        router.refresh();
      });

      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || undefined
        }
      }
    });

    if (signUpError) {
      setError(getUserFacingMessage(signUpError, "sign-in"));
      setIsSubmitting(false);
      return;
    }

    if (signUpData.session) {
      startTransition(() => {
        router.push("/app");
        router.refresh();
      });

      return;
    }

    setNotice("Account created. Check your email if confirmation is enabled, then sign in.");
    setMode("sign-in");
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-slate-200/80 bg-slate-100/80 p-1">
        <button
          className={`${modeToggleClassName} ${
            mode === "sign-in"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => {
            setMode("sign-in");
            setError(null);
            setNotice(null);
          }}
          type="button"
        >
          Existing account
        </button>
        <button
          className={`${modeToggleClassName} ${
            mode === "sign-up"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => {
            setMode("sign-up");
            setError(null);
            setNotice(null);
          }}
          type="button"
        >
          New account
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Secure access
        </p>
        <p className="text-sm leading-6 text-slate-600">
          {mode === "sign-in"
            ? "Sign in with your account to access HealthScope Analytics."
            : "Create an account. An administrator can grant you access to your organization."}
        </p>
      </div>

      {submitDisabled && disabledReason ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {disabledReason}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        {mode === "sign-up" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Full name</span>
            <input className={inputClassName} name="fullName" placeholder="Jordan Lee" />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            className={inputClassName}
            name="email"
            placeholder="you@hospital.org"
            required
            type="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input className={inputClassName} name="password" required type="password" />
        </label>

        <button
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          disabled={submitDisabled}
          type="submit"
        >
          {isSubmitting
            ? mode === "sign-in"
              ? "Signing in..."
              : "Creating account..."
            : mode === "sign-in"
              ? "Sign in"
              : "Create HealthScope account"}
        </button>

        {notice ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
