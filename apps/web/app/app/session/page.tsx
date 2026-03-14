import { getAccessibleTenantIds } from "@healthscope/auth";
import { requireAppSession } from "../../../lib/auth-guards";
import { getRoleLabel } from "../../../lib/role-labels";
import { getTenantAndOrganizationNames } from "../../../lib/tenant-labels";

export default async function SessionPage() {
  const session = await requireAppSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "unassigned";
  const accessibleTenantIds = getAccessibleTenantIds(session.context);
  const { tenantNames, organizationName } = await getTenantAndOrganizationNames(
    accessibleTenantIds,
    session.context.activeTenant?.organizationId ?? null
  );
  const activeRoleLabels = [
    ...new Set(
      session.context.memberships
        .filter((m) => m.status === "active")
        .map((m) => getRoleLabel(m.roleName))
    )
  ];

  return (
    <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur md:p-8 xl:p-10">
      <div className="space-y-6">
        <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Session
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Your session
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            Current user, active organization, and role summary. Use the sidebar to switch organization.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">User</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{session.context.actor.email}</dd>
            </div>
            {session.context.actor.fullName ? (
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{session.context.actor.fullName}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Active organization</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Workspace</dt>
              <dd className="font-medium text-slate-900">
                {tenantId !== "unassigned"
                  ? [tenantNames[tenantId] ?? "Workspace", organizationName].filter(Boolean).join(" · ") || "—"
                  : "No organization selected"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Roles</h2>
          <p className="mt-3 text-sm text-slate-700">
            {activeRoleLabels.length > 0 ? activeRoleLabels.join(", ") : "No roles"}
          </p>
        </div>
      </div>
    </section>
  );
}
