import Link from "next/link";
import { DEFAULT_APP_NAME, hasSupabaseEnv } from "@healthscope/config";
import { SignInForm } from "../../components/sign-in-form";
import { getUserFacingMessageFromParam } from "../../lib/user-error-messages";

export default function SignInPage({
  searchParams
}: {
  searchParams?: {
    error?: string;
  };
}) {
  const configured = hasSupabaseEnv();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/72 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
          <div className="absolute -right-20 top-[-5rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(16,185,129,0))]" />
          <div className="relative space-y-8">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Secure access
            </div>
            <div className="space-y-4">
              <h1 className="max-w-[11ch] text-5xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
                Sign in to operate HealthScope.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                Access dashboards, EHR integrations, and compliance workflows for your
                organization.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-slate-200/70 bg-white/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Secure sign-in
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Sign in securely to access dashboards, analytics, and reports.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Organization scope
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Your access is scoped to your organization and assigned role.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Platform status
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {configured ? "Ready. Sign-in is available." : "Setup in progress."}
                </p>
              </article>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                href="/"
              >
                Back to landing
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/70 bg-white/82 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur xl:p-10">
          <div className="mb-8 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {DEFAULT_APP_NAME}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Sign in to HealthScope Analytics
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Sign in with your organization credentials to access dashboards and analytics.
            </p>
          </div>

          {searchParams?.error ? (
            <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getUserFacingMessageFromParam(searchParams.error, "sign-in-url")}
            </p>
          ) : null}

          <SignInForm enabled={configured} />
        </section>
      </div>
    </main>
  );
}
