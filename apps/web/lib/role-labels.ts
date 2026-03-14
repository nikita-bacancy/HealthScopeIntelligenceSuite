/** Human-readable labels for role names shown in the UI. */
const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform administrator",
  tenant_admin: "Administrator",
  executive: "Executive",
  clinical_analyst: "Clinical analyst",
  finance_analyst: "Finance analyst",
  compliance_admin: "Compliance admin",
  integration_engineer: "Integration manager"
};

export function getRoleLabel(roleName: string): string {
  return (
    ROLE_LABELS[roleName] ??
    roleName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
