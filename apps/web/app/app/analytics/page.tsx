import Link from "next/link";
import { getAnalyticsOverview, getTenantReferenceData } from "../../../lib/analytics";
import { formatAnalyticsNumber } from "../../../lib/analytics-presenter";
import { requireAppSession } from "../../../lib/auth-guards";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const labelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";

function MetricCard({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
      <h3 className="text-sm font-semibold text-slate-500">{label}</h3>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </article>
  );
}

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams?: {
    days?: string;
    organizationId?: string;
    facilityId?: string;
  };
}) {
  const session = await requireAppSession();
  const activeTenant = session.context.activeTenant;

  if (!activeTenant) {
    return (
      <section className="rounded-[32px] border border-slate-200/70 bg-white/78 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Select an organization to view analytics
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Choose an organization in the sidebar to see its analytics.
        </p>
      </section>
    );
  }

  const days = Number(searchParams?.days ?? "30");
  const organizationId = searchParams?.organizationId ?? null;
  const facilityId = searchParams?.facilityId ?? null;
  let overview;
  let referenceData;

  try {
    [overview, referenceData] = await Promise.all([
      getAnalyticsOverview(session.context, { days, organizationId, facilityId }),
      getTenantReferenceData(session.context)
    ]);
  } catch (error) {
    const message = getUserFacingMessage(error, "analytics");
    return (
      <section className="rounded-[32px] border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 md:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">Analytics unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          {message}
        </p>
        <p className="mt-4 text-sm text-amber-800">
          Try switching organizations in the sidebar or reloading. If the issue persists,
          confirm your organization has data and you have access.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[32px] border border-slate-200/70 bg-white/78 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Analytics overview
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              Clinical, financial, and operational metrics for your organization.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Filter by reporting window, organization, and facility to focus on the metrics that matter.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Filter analytics window
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Narrow metrics by reporting window, organization, and facility.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-slate-300/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            href={`/api/v1/analytics/overview?days=${overview.windowDays}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}${facilityId ? `&facilityId=${encodeURIComponent(facilityId)}` : ""}`}
          >
            Export data
          </Link>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Patients"
          note="Patients in this organization's scope."
          value={formatAnalyticsNumber(overview.summary.totalPatients, "integer")}
        />
        <MetricCard
          label="Encounters"
          note={`Clinical encounters captured in the last ${overview.windowDays} days.`}
          value={formatAnalyticsNumber(overview.summary.encountersInWindow, "integer")}
        />
        <MetricCard
          label="Paid amount"
          note={`Insurance claim payments in the last ${overview.windowDays} days.`}
          value={formatAnalyticsNumber(overview.summary.paidAmountInWindow, "currency")}
        />
        <MetricCard
          label="Quality adherence"
          note="Share of evaluated quality measures currently marked as met."
          value={formatAnalyticsNumber(overview.summary.qualityAdherenceRate, "percent")}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Clinical performance
          </h2>
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

        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Financial performance
          </h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
              <span className="text-sm font-semibold text-slate-500">Claims in window</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.claimsInWindow, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Billed amount</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.financial.billedAmountInWindow, "currency")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Allowed amount</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.financial.allowedAmountInWindow, "currency")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Denial rate</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.denialRate, "percent")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Data connections
          </h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
              <span className="text-sm font-semibold text-slate-500">Connected EHR sources</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.summary.activeSources, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Paused connections</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.operational.sourcesPaused, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Connections with errors</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.operational.sourcesInError, "integer")}
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4">
              <span className="text-sm font-semibold text-slate-500">Measures evaluated</span>
              <span className="text-lg font-semibold text-slate-950">
                {formatAnalyticsNumber(overview.quality.measuresEvaluatedInWindow, "integer")}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
