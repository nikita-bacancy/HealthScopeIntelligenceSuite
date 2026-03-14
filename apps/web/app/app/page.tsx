import { requireAppSession } from "../../lib/auth-guards";
import { FeedbackBanner } from "../../components/feedback-banner";
import { getUserFacingMessageFromParam } from "../../lib/user-error-messages";

export default async function AppHomePage({
  searchParams
}: {
  searchParams?: {
    success?: string;
    error?: string;
  };
}) {
  const session = await requireAppSession();
  const activeTenant = session.context.activeTenant;

  return (
    <>
      <section className="rounded-[32px] border border-slate-200/70 bg-white/78 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur xl:p-10">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Your workspace
          </div>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              You're signed in to HealthScope Analytics.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Manage your organization, facilities, EHR connections, dashboards, and compliance from here.
            </p>
          </div>

          <div className="space-y-3">
            {searchParams?.success ? (
              <FeedbackBanner message={searchParams.success} tone="success" />
            ) : null}
            {searchParams?.error ? (
              <FeedbackBanner
                message={getUserFacingMessageFromParam(searchParams.error, "admin")}
                tone="error"
              />
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">User</h3>
              <p className="mt-3 break-words text-xl font-semibold text-slate-950">
                {session.context.actor.email}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Full name: {session.context.actor.fullName ?? "Not set"}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">Access</h3>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {session.context.memberships.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organizations you can access.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200/80 bg-white/80 p-5">
              <h3 className="text-sm font-semibold text-slate-500">Organization</h3>
              <p className="mt-3 break-words text-xl font-semibold text-slate-950">
                {activeTenant?.tenantId ?? "Unassigned"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeTenant
                  ? `Organization ${activeTenant.organizationId}`
                  : "Ask an administrator to grant you access to an organization."}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200/70 bg-white/78 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur xl:p-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Quick actions
          </h2>
          <div className="mt-5 space-y-4">
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0 md:grid-cols-[170px_1fr]">
              <span className="text-sm font-semibold text-slate-500">Dashboard</span>
              <span className="text-sm leading-6 text-slate-700">
                Use the dashboard for executive KPIs across clinical, financial, and operational metrics.
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0 md:grid-cols-[170px_1fr]">
              <span className="text-sm font-semibold text-slate-500">Analytics view</span>
              <span className="text-sm leading-6 text-slate-700">
                Review clinical, financial, and operational metrics for your organization.
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[170px_1fr]">
              <span className="text-sm font-semibold text-slate-500">Switch organization</span>
              <span className="text-sm leading-6 text-slate-700">
                Switch the active organization in the sidebar when you have access to more than one.
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[170px_1fr]">
              <span className="text-sm font-semibold text-slate-500">Manage users and roles</span>
              <span className="text-sm leading-6 text-slate-700">
                Edit user display name, role, scope, and suspension status from Admin.
              </span>
            </div>
            <div className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[170px_1fr]">
              <span className="text-sm font-semibold text-slate-500">EHR connections</span>
              <span className="text-sm leading-6 text-slate-700">
                Register EHR endpoints and set sync schedules from Integrations.
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
