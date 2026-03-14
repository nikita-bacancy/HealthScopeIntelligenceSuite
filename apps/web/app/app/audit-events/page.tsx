import { cookies } from "next/headers";
import { requireAppSession } from "../../../lib/auth-guards";
import {
  getActionLabel,
  getAuditEvents,
  getAuditResourceLabels,
  getOutcomeLabel,
  getTargetIdShort,
  getTargetTypeLabel
} from "../../../lib/audit-events";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

export default async function AuditEventsPage() {
  const session = await requireAppSession();

  if (!session.context.activeTenant) {
    return (
      <section className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 md:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">No organization selected</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          Select an organization in the sidebar to view audit events for that tenant.
        </p>
      </section>
    );
  }

  const cookieStore = await cookies();
  const tenantId = session.context.activeTenant.tenantId;
  const { data: events, error } = await getAuditEvents(cookieStore, tenantId, 50);

  if (error) {
    return (
      <section className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-6 shadow-sm sm:p-7 md:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">Audit events unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          {getUserFacingMessage(error, "dashboard")}
        </p>
      </section>
    );
  }

  const resourceLabels = events.length > 0 ? await getAuditResourceLabels(cookieStore, tenantId, events) : {};

  return (
    <section className="rounded-[24px] border border-slate-200/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur md:p-8 xl:p-10">
      <div className="space-y-6">
        <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Compliance
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Audit events
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600">
            Recent audit trail for your organization. Actions, targets, and outcomes.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50/90">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                What happened
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Category
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Resource
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                When
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/70">
            {events.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                  No audit events yet for this organization.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  className="transition-colors hover:bg-emerald-50/40"
                  key={event.id}
                >
                  <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
                    {getActionLabel(event.action)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                    {getTargetTypeLabel(event.target_type)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700" title={event.target_id}>
                    {resourceLabels[event.target_id] ?? getTargetIdShort(event.target_id)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <span
                      className={
                        event.outcome === "success"
                          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                          : "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                      }
                    >
                      {getOutcomeLabel(event.outcome)}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                    {new Date(event.occurred_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
