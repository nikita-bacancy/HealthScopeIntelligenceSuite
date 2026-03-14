import Link from "next/link";
import { formatAnalyticsNumber } from "../../../lib/analytics-presenter";
import { getAnalyticsOverview, getTenantReferenceData } from "../../../lib/analytics";
import { loadSnapshots } from "../../../lib/snapshots";
import { requireAppSession } from "../../../lib/auth-guards";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const labelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";

function Stat({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
  );
}

function MiniBar({
  values,
  color = "bg-emerald-500",
  label
}: {
  values: number[];
  color?: string;
  label: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-[0.12em]">{label}</span>
        <span>{values.length} pts</span>
      </div>
      <div className="flex items-end gap-1 rounded-xl bg-slate-50 px-2 py-2">
        {values.map((v, idx) => (
          <div
            key={idx}
            className={`${color} w-full rounded-sm`}
            style={{ height: `${(v / max) * 56 + 4}px` }}
            title={String(v)}
          />
        ))}
      </div>
    </div>
  );
}

function Sparkline({
  values,
  stroke = "#10b981",
  height = 80,
  label
}: {
  values: number[];
  stroke?: string;
  height?: number;
  label: string;
}) {
  if (values.length === 0) {
    return (
      <div className="flex h-[80px] items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
        No data
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const gradientId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-[0.12em]">{label}</span>
        <span>
          {values[values.length - 1]} (latest)
        </span>
      </div>
      <div className="rounded-xl bg-slate-50 px-2 py-3">
        <svg viewBox="0 0 100 80" width="100%" height={height}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            points={points.join(" ")}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polygon
            fill={`url(#${gradientId})`}
            points={`0,80 ${points.join(" ")} 100,80`}
          />
        </svg>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: {
    days?: string;
    organizationId?: string;
    facilityId?: string;
  };
}) {
  const session = await requireAppSession();
  if (!session.context.activeTenant && session.context.memberships.length === 0) {
    return (
      <section className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 md:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">No organization access</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          Your account doesn't have access to an organization yet. Ask an administrator to invite you.
        </p>
      </section>
    );
  }
  const days = Number(searchParams?.days ?? "30");
  const organizationId = searchParams?.organizationId ?? null;
  const facilityId = searchParams?.facilityId ?? null;
  let overview;
  let referenceData;
  let snapshots;

  try {
    [overview, referenceData, snapshots] = await Promise.all([
      getAnalyticsOverview(session.context, { days, organizationId, facilityId }),
      getTenantReferenceData(session.context),
      loadSnapshots(session.context.activeTenant?.tenantId ?? session.context.memberships[0]?.tenantId ?? "")
    ]);
  } catch (error) {
    const message = getUserFacingMessage(error, "dashboard");
    return (
      <section className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 md:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">Dashboard unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          {message}
        </p>
        <p className="mt-4 text-sm text-amber-800">
          Try switching organizations in the sidebar or reloading. Confirm you have access to an organization.
        </p>
      </section>
    );
  }

  const patientTrend = snapshots
    .filter((s) => s.metric_key === "patients.total")
    .map((s) => Number(s.value_numeric ?? 0));
  const encounterTrend = snapshots
    .filter((s) => s.metric_key === "encounters.total")
    .map((s) => Number(s.value_numeric ?? 0));

  const billed = overview.financial.billedAmountInWindow;
  const allowed = overview.financial.allowedAmountInWindow;
  const paid = overview.summary.paidAmountInWindow;
  const allowedPct = billed > 0 ? (allowed / billed) * 100 : 0;
  const paidPct = billed > 0 ? (paid / billed) * 100 : 0;
  const deniedCount = overview.summary.denialRate > 0
    ? Math.round((overview.summary.denialRate / 100) * overview.summary.claimsInWindow)
    : 0;

  return (
    <>
      <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur md:p-8 xl:p-10">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Executive dashboard
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              Clinical, financial, and operational KPIs at a glance.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Metrics for your organization and facilities. Adjust the time window and scope below.
            </p>
          </div>
          <form className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2">
              <span className={labelClassName}>Window</span>
              <select className={inputClassName} defaultValue={String(overview.windowDays)} name="days">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Organization</span>
              <select className={inputClassName} defaultValue={organizationId ?? ""} name="organizationId">
                <option value="">All organizations</option>
                {referenceData.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Facility</span>
              <select className={inputClassName} defaultValue={facilityId ?? ""} name="facilityId">
                <option value="">All facilities</option>
                {referenceData.facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600"
                type="submit"
              >
                Apply filters
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total patients"
          value={formatAnalyticsNumber(overview.summary.totalPatients, "integer")}
          note="Patients in scope for this organization and window."
        />
        <Stat
          label="Encounters"
          value={formatAnalyticsNumber(overview.summary.encountersInWindow, "integer")}
          note={`Encounters in the last ${overview.windowDays} days.`}
        />
        <Stat
          label="Paid amount"
          value={formatAnalyticsNumber(overview.summary.paidAmountInWindow, "currency")}
          note="Claims paid in the reporting window."
        />
        <Stat
          label="Quality adherence"
          value={formatAnalyticsNumber(overview.summary.qualityAdherenceRate, "percent")}
          note="Measures met / evaluated."
        />
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Clinical</h2>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/app/analytics">
              Open analytics
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
              <span className="text-sm font-semibold text-slate-500">Inpatient admissions</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.inpatientAdmissionsInWindow, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Average length of stay</span>
              <span className="text-lg font-semibold text-slate-950">
                {overview.clinical.averageLengthOfStayDays.toFixed(1)} days
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Emergency visits</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.clinical.emergencyVisitsInWindow, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Telehealth visits</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.clinical.telehealthVisitsInWindow, "integer")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Financial</h2>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/app/analytics">
              Open analytics
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-500">Billed</p>
              <p className="text-xl font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.financial.billedAmountInWindow, "currency")}
              </p>
              <p className="text-sm text-slate-600">
                Allowed: {formatAnalyticsNumber(overview.financial.allowedAmountInWindow, "currency")} ({allowedPct.toFixed(1)}%)
              </p>
              <p className="text-sm text-slate-600">
                Paid: {formatAnalyticsNumber(paid, "currency")} ({paidPct.toFixed(1)}%)
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-500">Claims volume</p>
              <p className="text-xl font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.claimsInWindow, "integer")}
              </p>
              <p className="text-sm text-slate-600">
                Denied: {deniedCount} ({formatAnalyticsNumber(overview.summary.denialRate, "percent")})
              </p>
              <p className="text-sm text-slate-600">Window: last {overview.windowDays} days</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Data connections</h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
              <span className="text-sm font-semibold text-slate-500">Connected EHR sources</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.activeSources, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Connections with errors</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.operational.sourcesInError, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Paused connections</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.operational.sourcesPaused, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Quality measures evaluated</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.quality.measuresEvaluatedInWindow, "integer")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Alerts & follow-ups</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>• If denial rate &gt; 0, review claims in the last window.</p>
            <p>• If connections have errors, open Integrations to run or fix data sync.</p>
            <p>• Use Analytics for deeper drill-down on quality adherence.</p>
          </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            href="/app/integrations"
          >
            Open integrations
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            href="/api/v1/analytics/overview"
          >
            Export data
          </Link>
        </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Trends</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Recent patient and encounter trends.
        </p>
        <div className="mt-4 grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
            <MiniBar label="Patients" values={patientTrend.slice(0, 10).reverse()} />
            <Sparkline label="Patients (trend)" values={patientTrend.slice(0, 10).reverse()} stroke="#10b981" />
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4">
            <MiniBar label="Encounters" values={encounterTrend.slice(0, 10).reverse()} color="bg-amber-500" />
            <Sparkline label="Encounters (trend)" values={encounterTrend.slice(0, 10).reverse()} stroke="#f59e0b" />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Metric history</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Stored metrics for this organization.
        </p>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Metric
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Value
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Period end
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/70">
                {snapshots.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={3}>
                      No metrics yet. Run a data sync from Integrations.
                    </td>
                  </tr>
                ) : (
                  snapshots.slice(0, 10).map((snap) => (
                    <tr className="transition-colors hover:bg-emerald-50/40" key={`${snap.metric_key}-${snap.period_end}`}>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                        {snap.metric_label}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                        {formatAnalyticsNumber(Number(snap.value_numeric ?? 0), "integer")}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                        {new Date(snap.period_end).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
