import Link from "next/link";
import { getAccessibleTenantIds } from "@healthscope/auth";
import { requireAppSession } from "../../lib/auth-guards";
import { SignOutButton } from "../../components/sign-out-button";
import { switchTenantAction } from "./actions";

const navItems = [
  { href: "/app", label: "Overview" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/admin", label: "Admin" },
  { href: "/app/integrations", label: "Integrations" },
  { href: "/api/v1/auth/session", label: "Session" },
  { href: "/api/v1/compliance/audit-events", label: "Audit events" }
];

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAppSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "unassigned";
  const accessibleTenantIds = getAccessibleTenantIds(session.context);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-stretch">
        <aside className="flex flex-col rounded-[24px] border border-slate-200/70 bg-white/78 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur xl:min-h-0">
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                HealthScope
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  HealthScope Analytics
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Signed in as {session.context.actor.email}
                </p>
                <p className="text-sm font-medium text-slate-500">Workspace: {tenantId}</p>
              </div>
            </div>

            {accessibleTenantIds.length > 1 ? (
              <form action={switchTenantAction} className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Organization
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    defaultValue={tenantId}
                    name="tenantId"
                  >
                    {accessibleTenantIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  type="submit"
                >
                  Switch organization
                </button>
              </form>
            ) : null}

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100/90 hover:text-slate-950"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Access
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your access is based on your organization and role.
              </p>
            </div>

            <div className="mt-auto pt-4">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <section className="grid gap-4 sm:gap-6">{children}</section>
      </div>
    </main>
  );
}
