import { createSupabaseServerClient } from "@healthscope/auth/supabase";

/** Human-readable labels for audit UI. Add new actions here as they are introduced. */
const ACTION_LABELS: Record<string, string> = {
  "integration.source.updated": "Integration source updated",
  "integration.fhir_source.created": "FHIR data source created",
  "integration.sync.job.created": "Sync job started",
  "tenant.organization.created": "Organization created",
  "tenant.facility.created": "Facility created",
  "tenant.membership.upserted": "Member added or updated",
  "tenant.membership.updated": "Member updated",
  "bootstrap.audit.preview": "Audit preview"
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  tenant_admin_action: "Admin action",
  integration_sync_job: "Sync job"
};

/** Convert dot.case action to a friendly label (e.g. "integration.source.updated" → "Integration source updated"). */
export function getActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
}

/** Human label for target_type. */
export function getTargetTypeLabel(targetType: string): string {
  return (
    TARGET_TYPE_LABELS[targetType] ??
    targetType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Short display for outcome (capitalized). */
export function getOutcomeLabel(outcome: string): string {
  return outcome.charAt(0).toUpperCase() + outcome.slice(1).toLowerCase();
}

/** Short reference for target_id (first 8 chars) for display; full id available on hover/title. */
export function getTargetIdShort(targetId: string): string {
  if (!targetId || targetId.length <= 10) return targetId;
  return `${targetId.slice(0, 8)}…`;
}

/** Which entity table the target_id refers to, derived from action. */
const ACTION_RESOURCE_KIND: Record<string, "organization" | "facility" | "membership" | "data_source"> = {
  "tenant.organization.created": "organization",
  "tenant.facility.created": "facility",
  "tenant.membership.upserted": "membership",
  "tenant.membership.updated": "membership",
  "integration.fhir_source.created": "data_source",
  "integration.source.updated": "data_source"
};

/**
 * Batch-resolve target IDs to display names (organization, facility, data source, member).
 * Returns a map of target_id → label; use getTargetIdShort as fallback when missing.
 */
export async function getAuditResourceLabels(
  cookieStore: Awaited<ReturnType<typeof import("next/headers").cookies>>,
  tenantId: string,
  events: AuditEventRow[]
): Promise<Record<string, string>> {
  const supabase = createSupabaseServerClient(cookieStore);
  if (!supabase) return {};

  const byKind: Record<string, string[]> = {
    organization: [],
    facility: [],
    membership: [],
    data_source: []
  };
  for (const e of events) {
    const kind = ACTION_RESOURCE_KIND[e.action];
    if (kind && e.target_id && !byKind[kind].includes(e.target_id)) {
      byKind[kind].push(e.target_id);
    }
  }

  const labels: Record<string, string> = {};

  const [orgs, facilities, memberships, dataSources] = await Promise.all([
    byKind.organization.length
      ? supabase
          .from("organizations")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", byKind.organization)
      : { data: [] },
    byKind.facility.length
      ? supabase
          .from("facilities")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", byKind.facility)
      : { data: [] },
    byKind.membership.length
      ? supabase
          .from("tenant_memberships")
          .select("id, role_name")
          .eq("tenant_id", tenantId)
          .in("id", byKind.membership)
      : { data: [] },
    byKind.data_source.length
      ? supabase
          .from("data_sources")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", byKind.data_source)
      : { data: [] }
  ]);

  for (const row of orgs.data ?? []) {
    labels[row.id] = row.name ?? "Organization";
  }
  for (const row of facilities.data ?? []) {
    labels[row.id] = row.name ?? "Facility";
  }
  for (const row of memberships.data ?? []) {
    const role = row.role_name ? ` (${row.role_name})` : "";
    labels[row.id] = `Member${role}`;
  }
  for (const row of dataSources.data ?? []) {
    labels[row.id] = row.name ?? "Data source";
  }

  return labels;
}

export type AuditEventRow = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  outcome: string;
  metadata: unknown;
  occurred_at: string;
};

export async function getAuditEvents(
  cookieStore: Awaited<ReturnType<typeof import("next/headers").cookies>>,
  tenantId: string,
  limit: number
): Promise<{ data: AuditEventRow[]; error: Error | null }> {
  const supabase = createSupabaseServerClient(cookieStore);

  if (!supabase) {
    return {
      data: [],
      error: new Error("Supabase is not configured.")
    };
  }

  const cappedLimit = Math.min(Math.max(1, limit), 100);
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, target_type, target_id, outcome, metadata, occurred_at")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false })
    .limit(cappedLimit);

  if (error) {
    return {
      data: [],
      error
    };
  }

  return {
    data: (data ?? []) as AuditEventRow[],
    error: null
  };
}
