"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@healthscope/auth/supabase";
import { requireTenantAdminSession } from "../../../lib/auth-guards";
import { insertAuditEvent } from "../../../lib/admin";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

const ALLOWED_ROLES = new Set([
  "tenant_admin",
  "executive",
  "clinical_analyst",
  "finance_analyst",
  "compliance_admin",
  "integration_engineer"
]);

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function assertOrganizationInTenant(
  tenantId: string,
  organizationId: string,
  client: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
) {
  const { data, error } = await client
    .from("organizations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Selected organization is outside the active tenant.");
  }
}

async function assertFacilityInTenant(
  tenantId: string,
  facilityId: string,
  client: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
) {
  const { data, error } = await client
    .from("facilities")
    .select("id, organization_id")
    .eq("tenant_id", tenantId)
    .eq("id", facilityId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Selected facility is outside the active tenant.");
  }

  return data;
}

function adminRedirect(kind: "success" | "error", message: string) {
  const params = new URLSearchParams({
    [kind]: message
  });

  redirect(`/app/admin?${params.toString()}`);
}

function normalizeMembershipStatus(value: string) {
  return value === "suspended" ? "suspended" : "active";
}

export async function createOrganizationAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const name = readValue(formData, "name");
    const type = readValue(formData, "type") || "hospital";

    if (!name) {
      throw new Error("Organization name is required.");
    }

    const { data, error } = await client
      .from("organizations")
      .insert({
        tenant_id: session.context.activeTenant?.tenantId,
        name,
        type,
        status: "active"
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditEvent(session.context, "tenant.organization.created", data.id);
    revalidatePath("/app");
    revalidatePath("/app/admin");
  } catch (error) {
    adminRedirect("error", getUserFacingMessage(error, "admin"));
  }

  adminRedirect("success", "Organization created.");
}

export async function createFacilityAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const organizationId = readValue(formData, "organizationId");
    const name = readValue(formData, "name");
    const facilityType = readValue(formData, "facilityType") || "hospital";
    const timezone = readValue(formData, "timezone") || "America/Chicago";
    const externalId = readValue(formData, "externalId");
    const tenantId = session.context.activeTenant?.tenantId;

    if (!tenantId || !organizationId || !name) {
      throw new Error("Organization and facility name are required.");
    }

    await assertOrganizationInTenant(tenantId, organizationId, client);

    const { data, error } = await client
      .from("facilities")
      .insert({
        tenant_id: tenantId,
        organization_id: organizationId,
        name,
        facility_type: facilityType,
        timezone,
        external_id: externalId || null
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditEvent(session.context, "tenant.facility.created", data.id);
    revalidatePath("/app/admin");
  } catch (error) {
    adminRedirect("error", getUserFacingMessage(error, "admin"));
  }

  adminRedirect("success", "Facility created.");
}

export async function inviteMembershipAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const email = readValue(formData, "email").toLowerCase();
    const fullName = readValue(formData, "fullName");
    const roleName = readValue(formData, "roleName");
    const organizationId = readValue(formData, "organizationId") || null;
    const facilityId = readValue(formData, "facilityId") || null;
    const tenantId = session.context.activeTenant?.tenantId;

    if (!tenantId || !email || !roleName) {
      throw new Error("Email, role, and active tenant are required.");
    }

    if (organizationId) {
      await assertOrganizationInTenant(tenantId, organizationId, client);
    }

    if (facilityId) {
      const facility = await assertFacilityInTenant(tenantId, facilityId, client);

      if (organizationId && facility.organization_id !== organizationId) {
        throw new Error("Selected facility does not belong to the chosen organization.");
      }
    }

    const existingUserResult = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUserResult.error) {
      throw new Error(existingUserResult.error.message);
    }

    let userId = existingUserResult.data?.id ?? null;

    if (!userId) {
      const inviteResult = await client.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName
        }
      });

      if (inviteResult.error || !inviteResult.data.user) {
        throw new Error(inviteResult.error?.message ?? "Unable to invite user.");
      }

      userId = inviteResult.data.user.id;
    }

    const { error: userUpdateError } = await client
      .from("users")
      .update({
        tenant_id: tenantId,
        full_name: fullName || null
      })
      .eq("id", userId);

    if (userUpdateError) {
      throw new Error(userUpdateError.message);
    }

    const { data: membership, error: membershipError } = await client
      .from("tenant_memberships")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          organization_id: organizationId,
          facility_id: facilityId,
          role_name: roleName,
          status: "active"
        },
        {
          onConflict: "tenant_id,user_id,role_name,organization_id,facility_id",
          ignoreDuplicates: false
        }
      )
      .select("id")
      .single();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    await insertAuditEvent(session.context, "tenant.membership.upserted", membership.id);
    revalidatePath("/app");
    revalidatePath("/app/admin");
  } catch (error) {
    adminRedirect("error", getUserFacingMessage(error, "admin"));
  }

  adminRedirect("success", "User invited and membership assigned.");
}

export async function updateMembershipAction(formData: FormData) {
  try {
    const session = await requireTenantAdminSession();
    const client = createSupabaseAdminClient();

    if (!client) {
      throw new Error("Supabase service role environment is not configured.");
    }

    const membershipId = readValue(formData, "membershipId");
    const userId = readValue(formData, "userId");
    const fullName = readValue(formData, "fullName");
    const roleName = readValue(formData, "roleName");
    const status = normalizeMembershipStatus(readValue(formData, "status"));
    const organizationId = readValue(formData, "organizationId") || null;
    const facilityId = readValue(formData, "facilityId") || null;
    const tenantId = session.context.activeTenant?.tenantId;

    if (!tenantId || !membershipId || !userId || !ALLOWED_ROLES.has(roleName)) {
      throw new Error("Membership update is missing required fields.");
    }

    if (organizationId) {
      await assertOrganizationInTenant(tenantId, organizationId, client);
    }

    if (facilityId) {
      const facility = await assertFacilityInTenant(tenantId, facilityId, client);

      if (organizationId && facility.organization_id !== organizationId) {
        throw new Error("Selected facility does not belong to the chosen organization.");
      }
    }

    const { error: membershipError } = await client
      .from("tenant_memberships")
      .update({
        role_name: roleName,
        status,
        organization_id: organizationId,
        facility_id: facilityId
      })
      .eq("id", membershipId)
      .eq("tenant_id", tenantId);

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const { error: userError } = await client
      .from("users")
      .update({
        full_name: fullName || null,
        status
      })
      .eq("id", userId);

    if (userError) {
      throw new Error(userError.message);
    }

    if (status === "suspended") {
      const { error: siblingError } = await client
        .from("tenant_memberships")
        .update({
          status: "suspended"
        })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId);

      if (siblingError) {
        throw new Error(siblingError.message);
      }
    }

    await insertAuditEvent(session.context, "tenant.membership.updated", membershipId);
    revalidatePath("/app");
    revalidatePath("/app/admin");
  } catch (error) {
    adminRedirect("error", getUserFacingMessage(error, "admin"));
  }

  adminRedirect("success", "User access updated.");
}
