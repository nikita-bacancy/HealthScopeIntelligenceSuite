import Link from "next/link";
import { DEFAULT_APP_NAME, getPlatformSummary, hasSupabaseEnv } from "@healthscope/config";
import { CORE_API_ROUTES, CORE_DOMAINS } from "@healthscope/data-model";
import { SessionSummary } from "../components/session-summary";

const summary = getPlatformSummary();

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-white/68 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="relative h-11 w-11 rounded-[18px] bg-[linear-gradient(135deg,#10b981,#f0a45d)]">
            <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {DEFAULT_APP_NAME}
            </p>
            <p className="text-lg font-semibold text-slate-950">
              Health Analytics & Business Intelligence
            </p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-current" />
          Healthcare analytics platform
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.32fr_0.88fr]">
        <article className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/74 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
          <div className="absolute -right-24 top-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(16,185,129,0))]" />
          <div className="relative space-y-8">
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Healthcare analytics foundation
            </div>
            <div className="space-y-4">
              <h1 className="max-w-[11ch] text-5xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl xl:text-7xl">
                Clinical, financial, and operational intelligence for your health system.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Dashboards, EHR integrations, quality metrics, and compliance reporting—all with
                role-based access and secure audit trails for healthcare organizations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600"
                href="/sign-in"
              >
                Open sign-in
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-slate-200/70 bg-white/72 p-5">
                <h3 className="text-sm font-semibold text-slate-500">Capabilities</h3>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  {CORE_DOMAINS.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Auth, organizations, compliance, analytics, and integrations.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/72 p-5">
                <h3 className="text-sm font-semibold text-slate-500">API coverage</h3>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  {CORE_API_ROUTES.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  REST APIs for analytics, compliance, and integrations.
                </p>
              </article>
              <article className="rounded-3xl border border-slate-200/70 bg-white/72 p-5">
                <h3 className="text-sm font-semibold text-slate-500">Data freshness</h3>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  {summary.analyticsFreshness}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Regular data refresh to keep dashboards and reports up to date.
                </p>
              </article>
            </div>
          </div>
        </article>

        <div className="grid gap-6">
          <aside className="rounded-[28px] border border-slate-200/70 bg-white/72 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">Platform capabilities</h2>
            <ul className="mt-5 space-y-4">
              <li className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0 md:grid-cols-[130px_1fr]">
                <span className="text-sm font-semibold text-slate-500">Interoperability</span>
                <span className="text-sm leading-6 text-slate-700">{summary.interopStrategy}</span>
              </li>
              <li className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[130px_1fr]">
                <span className="text-sm font-semibold text-slate-500">Multi-organization</span>
                <span className="text-sm leading-6 text-slate-700">{summary.tenancyModel}</span>
              </li>
              <li className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[130px_1fr]">
                <span className="text-sm font-semibold text-slate-500">Compliance</span>
                <span className="text-sm leading-6 text-slate-700">
                  {summary.complianceBaseline}
                </span>
              </li>
            </ul>
          </aside>

          <SessionSummary configured={hasSupabaseEnv()} />

          <aside className="rounded-[28px] border border-slate-200/70 bg-white/72 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">What you get</h2>
            <ul className="mt-5 space-y-4">
              <li className="flex gap-3 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
                <span className="text-emerald-600" aria-hidden>✓</span>
                <span className="text-sm leading-6 text-slate-700">Executive dashboards and KPIs for clinical, financial, and operational metrics</span>
              </li>
              <li className="flex gap-3 border-t border-slate-200/70 pt-4">
                <span className="text-emerald-600" aria-hidden>✓</span>
                <span className="text-sm leading-6 text-slate-700">EHR integration with major health record systems</span>
              </li>
              <li className="flex gap-3 border-t border-slate-200/70 pt-4">
                <span className="text-emerald-600" aria-hidden>✓</span>
                <span className="text-sm leading-6 text-slate-700">Quality metrics tracking and compliance reporting</span>
              </li>
              <li className="flex gap-3 border-t border-slate-200/70 pt-4">
                <span className="text-emerald-600" aria-hidden>✓</span>
                <span className="text-sm leading-6 text-slate-700">Role-based access for clinicians, administrators, and executives</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
