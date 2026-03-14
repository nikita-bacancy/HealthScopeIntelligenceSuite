"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@healthscope/auth/supabase";
import { requireTenantAdminSession } from "../../../lib/auth-guards";
import { insertAuditEvent } from "../../../lib/admin";
import { upsertSourceCredentials } from "../../../lib/credentials";
import { createSyncJob, getQueuedJobs, simulateRunJob } from "../../../lib/integration-jobs";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireValue(value: string, label: string) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function normalizeSourceStatus(value: string) {
  return value === "paused" || value === "error" ? value : "active";
}

function normalizeAuthType(value: string) {
  return value === "basic" || value === "api-key" || value === "none" ? value : "oauth2";
}

function normalizeSyncFrequency(value: string) {
  return value === "daily" || value === "manual" ? value : "hourly";
}

function assertHttpsUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("FHIR base URL must be a valid URL.");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("FHIR base URL must start with http:// or https://.");
  }

  return url.toString().replace(/\/$/, "");
}

function integrationsRedirect(kind: "success" | "error", message: string) {
  const params = new URLSearchParams({
    [kind]: message
  });

  redirect(`/app/integrations?${params.toString()}`);
}

export async function createFhirSourceAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const tenantId = session.context.activeTenant?.tenantId;
    const organizationId = readValue(formData, "organizationId");
    const name = readValue(formData, "name");
    const baseUrl = assertHttpsUrl(readValue(formData, "baseUrl"));
    const authType = normalizeAuthType(readValue(formData, "authType"));
    const syncFrequency = normalizeSyncFrequency(readValue(formData, "syncFrequency"));

    if (!tenantId || !organizationId || !name || !baseUrl) {
      throw new Error("Organization, source name, and base URL are required.");
    }

    const { data: organization, error: organizationError } = await client
      .from("organizations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      throw new Error(organizationError.message);
    }

    if (!organization) {
      throw new Error("Selected organization is outside the active tenant.");
    }

    const { data, error } = await client
      .from("data_sources")
      .insert({
        tenant_id: tenantId,
        organization_id: organizationId,
        source_type: "fhir",
        name,
        base_url: baseUrl,
        auth_type: authType,
        sync_frequency: syncFrequency,
        status: "active"
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditEvent(session.context, "integration.fhir_source.created", data.id);
    revalidatePath("/app/integrations");
  } catch (error) {
    integrationsRedirect("error", getUserFacingMessage(error, "integrations"));
  }

  integrationsRedirect("success", "FHIR source registered.");
}

export async function updateDataSourceAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const tenantId = session.context.activeTenant?.tenantId;
    const sourceId = readValue(formData, "sourceId");
    const organizationId = readValue(formData, "organizationId");
    const name = readValue(formData, "name");
    const baseUrl = assertHttpsUrl(readValue(formData, "baseUrl"));
    const authType = normalizeAuthType(readValue(formData, "authType"));
    const syncFrequency = normalizeSyncFrequency(readValue(formData, "syncFrequency"));
    const status = normalizeSourceStatus(readValue(formData, "status"));

    if (!tenantId || !sourceId || !organizationId || !name) {
      throw new Error("Source update is missing required fields.");
    }

    const { data: source, error: sourceError } = await client
      .from("data_sources")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", sourceId)
      .maybeSingle();

    if (sourceError) {
      throw new Error(sourceError.message);
    }

    if (!source) {
      throw new Error("Selected source is outside the active tenant.");
    }

    const { data: organization, error: organizationError } = await client
      .from("organizations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", organizationId)
      .maybeSingle();

    if (organizationError) {
      throw new Error(organizationError.message);
    }

    if (!organization) {
      throw new Error("Selected organization is outside the active tenant.");
    }

    const { error } = await client
      .from("data_sources")
      .update({
        organization_id: organizationId,
        name,
        base_url: baseUrl,
        auth_type: authType,
        sync_frequency: syncFrequency,
        status
      })
      .eq("tenant_id", tenantId)
      .eq("id", sourceId);

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditEvent(session.context, "integration.source.updated", sourceId);
    revalidatePath("/app/integrations");
  } catch (error) {
    integrationsRedirect("error", getUserFacingMessage(error, "integrations"));
  }

  integrationsRedirect("success", "Source updated.");
}

export async function queueSyncJobAction(formData: FormData) {
  const session = await requireTenantAdminSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "";
  const dataSourceId = readValue(formData, "sourceId");

  if (!tenantId || !dataSourceId) {
    integrationsRedirect("error", getUserFacingMessage(new Error("Missing tenant or source"), "integrations"));
  }

  try {
    await createSyncJob({
      tenantId,
      dataSourceId,
      triggeredByUserId: session.context.actor.id
    });

    revalidatePath("/app/integrations");
    integrationsRedirect("success", "Sync job queued.");
  } catch (error) {
    integrationsRedirect("error", getUserFacingMessage(error, "integrations"));
  }
}

export async function simulateRunQueuedJobsAction() {
  const session = await requireTenantAdminSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "";

  try {
    const queued = await getQueuedJobs(session.context);

    for (const job of queued) {
      await simulateRunJob({
        tenantId,
        jobId: job.id,
        dataSourceId: job.data_source_id,
        attempts: job.attempts ?? 0
      });
    }

    revalidatePath("/app/integrations");
    integrationsRedirect("success", queued.length ? "Queued jobs marked succeeded." : "No queued jobs.");
  } catch (error) {
    integrationsRedirect("error", getUserFacingMessage(error, "integrations"));
  }
}

export async function upsertCredentialsAction(formData: FormData) {
  const session = await requireTenantAdminSession();
  const tenantId = session.context.activeTenant?.tenantId ?? "";
  const dataSourceId = readValue(formData, "sourceId");
  const authType = readValue(formData, "authType") || "oauth2";

  if (!tenantId || !dataSourceId) {
    integrationsRedirect("error", getUserFacingMessage(new Error("Missing tenant or source"), "integrations"));
  }

  try {
    if (authType === "oauth2") {
      requireValue(readValue(formData, "clientId"), "Client ID");
      requireValue(readValue(formData, "clientSecret"), "Client secret");
      requireValue(readValue(formData, "tokenUrl"), "Token URL");
    }

    if (authType === "api-key") {
      requireValue(readValue(formData, "apiKey"), "API key");
    }

    if (authType === "basic") {
      requireValue(readValue(formData, "basicUsername"), "Basic username");
      requireValue(readValue(formData, "basicPassword"), "Basic password");
    }

    await upsertSourceCredentials({
      tenantId,
      dataSourceId,
      authType,
      clientId: readValue(formData, "clientId") || null,
      clientSecret: readValue(formData, "clientSecret") || null,
      tokenUrl: readValue(formData, "tokenUrl") || null,
      apiKey: readValue(formData, "apiKey") || null,
      basicUsername: readValue(formData, "basicUsername") || null,
      basicPassword: readValue(formData, "basicPassword") || null
    });
    revalidatePath("/app/integrations");
    integrationsRedirect("success", "Credentials saved.");
  } catch (error) {
    integrationsRedirect("error", getUserFacingMessage(error, "integrations"));
  }
}
