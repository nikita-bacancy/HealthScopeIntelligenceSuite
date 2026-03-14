import { createSupabaseAdminClient } from "@healthscope/auth/supabase";

export type TenantLabels = {
  tenantNames: Record<string, string>;
  organizationName: string | null;
};

export async function getTenantAndOrganizationNames(
  tenantIds: string[],
  organizationId: string | null
): Promise<TenantLabels> {
  const client = createSupabaseAdminClient();

  if (!client) {
    return { tenantNames: {}, organizationName: null };
  }

  const [tenantsResult, orgResult] = await Promise.all([
    tenantIds.length > 0
      ? client
          .from("tenants")
          .select("id, name")
          .in("id", tenantIds)
      : { data: [], error: null },
    organizationId
      ? client
          .from("organizations")
          .select("id, name")
          .eq("id", organizationId)
          .maybeSingle()
      : { data: null, error: null }
  ]);

  const tenantNames: Record<string, string> = {};
  if (tenantsResult.data) {
    for (const row of tenantsResult.data) {
      tenantNames[row.id] = row.name ?? row.id;
    }
  }

  const organizationName = orgResult.data?.name ?? null;

  return {
    tenantNames,
    organizationName
  };
}
