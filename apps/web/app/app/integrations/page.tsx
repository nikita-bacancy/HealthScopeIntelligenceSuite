import Link from "next/link";
import { getIntegrationOverview } from "../../../lib/admin";
import { requireTenantAdminSession } from "../../../lib/auth-guards";
import { DataTable, type DataTableColumn } from "../../../components/data-table";
import { RedirectFeedbackToast } from "../../../components/redirect-feedback-toast";
import { SubmitButton } from "../../../components/submit-button";
import {
  createFhirSourceAction,
  queueSyncJobAction,
  simulateRunQueuedJobsAction,
  updateDataSourceAction,
  upsertCredentialsAction
} from "./actions";
import { getRecentJobs, getQueuedJobs } from "../../../lib/integration-jobs";
import { getRecentJobEvents } from "../../../lib/integration-jobs";
import { getCredentialsForSources } from "../../../lib/credentials";
import {
  sanitizeMessageForDisplay,
  getUserFacingMessageFromParam
} from "../../../lib/user-error-messages";

const inputClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const labelClassName = "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";

const sourceColumns: Array<
  DataTableColumn<{
    name: string;
    organization: string;
    endpoint: string;
    auth: string;
    sync: string;
    status: string;
    lastSync: string;
  }>
> = [
  { key: "name", header: "Name" },
  { key: "organization", header: "Organization" },
  { key: "endpoint", header: "Endpoint", variant: "mono" },
  { key: "auth", header: "Auth", capitalize: true },
  { key: "sync", header: "Sync", capitalize: true },
  { key: "status", header: "Status", capitalize: true },
  { key: "lastSync", header: "Last sync" }
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDateTimeCell(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const INTEGRATION_SECTIONS = ["overview", "sources", "credentials", "sync"] as const;
type IntegrationSection = (typeof INTEGRATION_SECTIONS)[number];

function normalizeSection(value: string | undefined): IntegrationSection {
  if (value && INTEGRATION_SECTIONS.includes(value as IntegrationSection)) return value as IntegrationSection;
  return "overview";
}

function integrationSectionHref(
  section: IntegrationSection,
  searchParams?: { success?: string; error?: string }
): string {
  const params = new URLSearchParams();
  params.set("section", section);
  if (searchParams?.success) params.set("success", searchParams.success);
  if (searchParams?.error) params.set("error", searchParams.error);
  return `/app/integrations?${params.toString()}`;
}

const SECTION_LABELS: Record<IntegrationSection, string> = {
  overview: "Overview",
  sources: "Data sources",
  credentials: "Credentials",
  sync: "Sync and jobs"
};

export default async function IntegrationsPage({
  searchParams
}: {
  searchParams?: {
    section?: string;
    success?: string;
    error?: string;
  };
}) {
  const session = await requireTenantAdminSession();
  const overview = await getIntegrationOverview(session.context);
  const recentJobs = await getRecentJobs(session.context, 8);
  const queuedJobs = await getQueuedJobs(session.context);
  const credentials = await getCredentialsForSources(session.context);
  const recentEvents = await getRecentJobEvents(session.context, 12);
  const currentSection = normalizeSection(searchParams?.section);
  const sourceRows = overview.dataSources.map((source) => ({
    name: source.name,
    organization:
      overview.organizations.find((organization) => organization.id === source.organization_id)?.name ??
      source.organization_id,
    endpoint: source.base_url,
    auth: source.auth_type,
    sync: source.sync_frequency,
    status: source.status,
    lastSync: formatDateTime(source.last_sync_at)
  }));

  return (
    <>
      <section className="rounded-[32px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:p-6 md:p-8 xl:p-10">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Integrations
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              Connect EHR and data sources for analytics.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Register EHR and data sources, manage connection credentials, and run data syncs to keep
              dashboards and reports up to date.
            </p>
          </div>

          <RedirectFeedbackToast
            error={searchParams?.error ? getUserFacingMessageFromParam(searchParams.error, "integrations") : null}
            success={searchParams?.success ?? null}
          />

          <nav aria-label="Integrations sections" className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
            {INTEGRATION_SECTIONS.map((section) => {
              const isActive = section === currentSection;
              return (
                <Link
                  key={section}
                  href={integrationSectionHref(section, searchParams)}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "rounded-2xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition"
                      : "rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  }
                >
                  {SECTION_LABELS[section]}
                </Link>
              );
            })}
          </nav>

          {currentSection === "overview" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-500">Data sources</h3>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {overview.dataSources.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registered EHR and data sources.
                  </p>
                </article>
                <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-500">Queued jobs</h3>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {queuedJobs.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sync jobs pending.
                  </p>
                </article>
                <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-500">Recent jobs</h3>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {recentJobs.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Last sync runs.
                  </p>
                </article>
                <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-500">Job events</h3>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {recentEvents.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Recent integration logs.
                  </p>
                </article>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Use the tabs above to manage data sources, credentials, and sync jobs.
              </p>
            </>
          )}

          {currentSection === "sources" && (
            <section className="grid gap-5 sm:gap-6">
              <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Add EHR connection
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter connection details for your EHR or data source.
          </p>

          <form action={createFhirSourceAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className={labelClassName}>Organization</span>
              <select className={inputClassName} name="organizationId" required defaultValue="">
                <option value="" disabled>
                  Select organization
                </option>
                {overview.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 md:col-span-2">
              <span className={labelClassName}>Source name</span>
              <input className={inputClassName} name="name" placeholder="e.g. Epic EHR" required />
            </label>
            <label className="block space-y-2 md:col-span-2">
                    <span className={labelClassName}>Base URL</span>
                    <input
                      className={inputClassName}
                      name="baseUrl"
                      placeholder="https://ehr.example.com/fhir/R4"
                      required
                    />
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Auth type</span>
              <select className={inputClassName} defaultValue="oauth2" name="authType">
                <option value="oauth2">OAuth 2.0</option>
                <option value="basic">Basic auth</option>
                <option value="api-key">API key</option>
                <option value="none">None</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className={labelClassName}>Sync frequency</span>
              <select className={inputClassName} defaultValue="hourly" name="syncFrequency">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <SubmitButton
              className="md:col-span-2"
              loadingLabel="Registering..."
            >
              Register data source
            </SubmitButton>
          </form>
        </div>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Integration status
          </h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Data sources and sync
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">Data sources</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Register and edit EHR and data source connections. Set credentials and sync schedule per source.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Data refresh
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">Scheduled sync</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Data is refreshed on a schedule (e.g. hourly or daily).
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Source count
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {overview.dataSources.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Registered data sources for your organization.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Registered source systems
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Registered data sources for your organization.
          </p>

          <div className="mt-6">
            <DataTable
              columns={sourceColumns}
              data={sourceRows}
              emptyMessage="No data sources registered yet."
            />
          </div>

          {overview.dataSources.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {overview.dataSources.map((source) => (
              <form
                action={updateDataSourceAction}
                className="rounded-[28px] border border-slate-200/80 bg-white/85 p-5 shadow-sm"
                key={source.id}
              >
                <input name="sourceId" type="hidden" value={source.id} />
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-200/70 pb-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <strong className="block text-lg font-semibold text-slate-950">
                      {source.name}
                    </strong>
                    <span className="block font-mono text-xs text-slate-500">{source.base_url}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {source.source_type}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        source.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : source.status === "paused"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Last sync
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{formatDateTime(source.last_sync_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{formatDateTime(source.updated_at)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <label className="block space-y-2 xl:col-span-2">
                    <span className={labelClassName}>Organization</span>
                    <select
                      className={inputClassName}
                      defaultValue={source.organization_id}
                      name="organizationId"
                    >
                      {overview.organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2 xl:col-span-3">
                    <span className={labelClassName}>Source name</span>
                    <input className={inputClassName} defaultValue={source.name} name="name" required />
                  </label>
                  <label className="block space-y-2 xl:col-span-3">
                    <span className={labelClassName}>Base URL</span>
                    <input
                      className={inputClassName}
                      defaultValue={source.base_url}
                      name="baseUrl"
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Auth type</span>
                    <select className={inputClassName} defaultValue={source.auth_type} name="authType">
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="basic">Basic auth</option>
                      <option value="api-key">API key</option>
                      <option value="none">None</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Sync frequency</span>
                    <select
                      className={inputClassName}
                      defaultValue={source.sync_frequency}
                      name="syncFrequency"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Status</span>
                    <select className={inputClassName} defaultValue={source.status} name="status">
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="error">Error</option>
                    </select>
                  </label>
                  <div className="flex items-end xl:col-span-1">
                    <SubmitButton className="w-full" loadingLabel="Saving...">
                      Save source
                    </SubmitButton>
                  </div>
                </div>
              </form>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      </section>
          )}

          {currentSection === "credentials" && (
      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Connection credentials</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Store connection credentials for each source. Requires administrator access.
        </p>
        <div className="mt-5 grid gap-4">
          {overview.dataSources.map((source) => {
            const cred = credentials.find((c) => c.data_source_id === source.id);
            return (
              <form
                action={upsertCredentialsAction}
                className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5"
                key={source.id}
              >
                <input name="sourceId" type="hidden" value={source.id} />
                <div className="mb-4 flex flex-col gap-1">
                  <strong className="text-base text-slate-900">{source.name}</strong>
                  <span className="text-xs text-slate-500">{source.base_url}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block space-y-2">
                    <span className={labelClassName}>Auth type</span>
                    <select className={inputClassName} defaultValue={cred?.auth_type ?? source.auth_type} name="authType">
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="basic">Basic auth</option>
                      <option value="api-key">API key</option>
                      <option value="none">None</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Client ID</span>
                    <input className={inputClassName} defaultValue={cred?.client_id ?? ""} name="clientId" />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Client secret</span>
                    <input
                      className={inputClassName}
                      name="clientSecret"
                      placeholder={cred?.client_secret ? "•••••••• set" : "Enter client secret"}
                      type="password"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Token URL</span>
                    <input className={inputClassName} defaultValue={cred?.token_url ?? ""} name="tokenUrl" />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>API key</span>
                    <input
                      className={inputClassName}
                      name="apiKey"
                      placeholder={cred?.api_key ? "•••••••• set" : "Enter API key"}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Basic username</span>
                    <input className={inputClassName} defaultValue={cred?.basic_username ?? ""} name="basicUsername" />
                  </label>
                  <label className="block space-y-2">
                    <span className={labelClassName}>Basic password</span>
                    <input
                      className={inputClassName}
                      name="basicPassword"
                      placeholder={cred?.basic_password ? "•••••••• set" : "Enter password"}
                      type="password"
                    />
                  </label>
                  <div className="flex items-end">
                    <SubmitButton className="w-full" loadingLabel="Saving...">
                      Save credentials
                    </SubmitButton>
                  </div>
                </div>
                {cred ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Last updated {new Date(cred.updated_at).toLocaleString()}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No credentials stored yet.</p>
                )}
              </form>
            );
          })}
        </div>
      </section>
          )}

          {currentSection === "sync" && (
            <>
      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Data sync</h2>
            <p className="text-sm leading-6 text-slate-600">
              Run a sync for any active source and review recent job history.
            </p>
          </div>
          <form action={simulateRunQueuedJobsAction} className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Pending: {queuedJobs.length}
            </div>
            <SubmitButton
              className="px-4 py-2 text-xs tracking-[0.04em]"
              loadingLabel="Running..."
              variant="secondary"
            >
              Run pending syncs
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6 grid gap-3">
          {overview.dataSources.map((source) => (
            <form
              action={queueSyncJobAction}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
              key={source.id}
            >
              <input name="sourceId" type="hidden" value={source.id} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{source.name}</span>
                <span className="text-xs text-slate-500">{source.base_url}</span>
              </div>
              <SubmitButton
                className="px-4 py-2 text-xs tracking-[0.04em]"
                loadingLabel="Running..."
              >
                Run sync
              </SubmitButton>
            </form>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Job
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Source
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Started
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Finished
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/70">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                      No sync jobs have been run yet.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => {
                    const source =
                      overview.dataSources.find((s) => s.id === job.data_source_id) ?? null;
                    const sourceLabel = source ? source.name : "Unknown source";
                    return (
                      <tr className="transition-colors hover:bg-emerald-50/40" key={job.id}>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                          Sync
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                          {sourceLabel}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700 capitalize">
                          {job.status}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                          {formatDateTimeCell(job.started_at)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                          {formatDateTimeCell(job.finished_at)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                          {sanitizeMessageForDisplay(job.message)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 md:p-7">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Job events</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Recent integration job logs across all sources.
        </p>
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Event
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Job
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Level
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Message
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/70">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                      No job events yet.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const jobIdToSourceName = new Map<string, string>();
                    recentJobs.forEach((job) => {
                      const src = overview.dataSources.find((s) => s.id === job.data_source_id);
                      jobIdToSourceName.set(job.id, src?.name ?? "Unknown source");
                    });
                    return recentEvents.map((event) => {
                      const jobSource =
                        jobIdToSourceName.get(event.job_id) ?? `Job ${event.job_id.slice(0, 8)}`;
                      const levelLabel =
                        event.level.charAt(0).toUpperCase() + event.level.slice(1).toLowerCase();
                      return (
                        <tr
                          className="transition-colors hover:bg-emerald-50/40"
                          key={event.id}
                        >
                          <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                            Log
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                            {jobSource}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                            {levelLabel}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                            {sanitizeMessageForDisplay(event.message)}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                            {formatDateTimeCell(event.occurred_at)}
                          </td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
            </>
          )}
        </div>
      </section>
    </>
  );
}
