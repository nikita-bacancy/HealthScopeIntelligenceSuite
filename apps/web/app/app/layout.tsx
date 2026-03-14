import { getAccessibleTenantIds } from "@healthscope/auth";
import { requireAppSession } from "../../lib/auth-guards";
import { getTenantAndOrganizationNames } from "../../lib/tenant-labels";
import { AppShell } from "./app-shell";
import { AppSidebar } from "./app-sidebar";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAppSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "unassigned";
  const accessibleTenantIds = getAccessibleTenantIds(session.context);
  const { tenantNames, organizationName } = await getTenantAndOrganizationNames(
    accessibleTenantIds,
    session.context.activeTenant?.organizationId ?? null
  );
  const workspaceLabel = tenantId !== "unassigned"
    ? [tenantNames[tenantId] ?? tenantId, organizationName].filter(Boolean).join(" · ")
    : tenantId;

  const sidebarProps = {
    actorEmail: session.context.actor.email,
    workspaceLabel,
    tenantId,
    accessibleTenantIds,
    tenantNames
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <AppShell
        desktopSidebar={<AppSidebar {...sidebarProps} />}
        mobileSidebar={<AppSidebar {...sidebarProps} />}
      >
        {children}
      </AppShell>
    </main>
  );
}
