import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ACTIVE_TENANT_COOKIE_NAME,
  buildSessionPayload,
  buildTenantContextFromMembership,
  getAccessibleTenantIds,
  isPlatformRole,
  selectActiveMembership,
  type MembershipRecord,
  type SessionContext
} from "./index";
import { createSupabaseServerClient } from "./supabase";

type MembershipRow = {
  tenant_id: string;
  organization_id: string | null;
  facility_id: string | null;
  role_name: string;
  status: "active" | "suspended";
};

export async function resolveSessionContext(
  request?: NextRequest
): Promise<
  | { ok: true; context: SessionContext }
  | { ok: false; code: string; message: string; status: number }
> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  if (!supabase) {
    return {
      ok: false,
      code: "SUPABASE_NOT_CONFIGURED",
      message: "Supabase environment variables are not configured.",
      status: 503
    };
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError) {
    return {
      ok: false,
      code: "SESSION_LOOKUP_FAILED",
      message: authError.message,
      status: 500
    };
  }

  if (!user) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "No active session was found.",
      status: 401
    };
  }

  const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }] =
    await Promise.all([
      supabase.from("users").select("id, email, full_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("tenant_memberships")
        .select("tenant_id, organization_id, facility_id, role_name, status")
        .eq("user_id", user.id)
        .eq("status", "active")
    ]);

  if (profileError) {
    return {
      ok: false,
      code: "PROFILE_LOOKUP_FAILED",
      message: profileError.message,
      status: 500
    };
  }

  if (membershipError) {
    return {
      ok: false,
      code: "MEMBERSHIP_LOOKUP_FAILED",
      message: membershipError.message,
      status: 500
    };
  }

  const membershipRecords: MembershipRecord[] = (memberships ?? [])
    .filter((membership: MembershipRow) => isPlatformRole(membership.role_name))
    .map((membership: MembershipRow) => ({
      tenantId: membership.tenant_id,
      organizationId: membership.organization_id,
      facilityId: membership.facility_id,
      roleName: membership.role_name as MembershipRecord["roleName"],
      status: membership.status
    }));

  const requestedTenantId =
    request?.headers.get("x-healthscope-tenant-id") ??
    request?.nextUrl.searchParams.get("tenantId") ??
    cookieStore.get(ACTIVE_TENANT_COOKIE_NAME)?.value;
  const activeMembership = selectActiveMembership(membershipRecords, requestedTenantId);

  let activeTenant = buildTenantContextFromMembership(activeMembership, membershipRecords);

  if (activeTenant === null && activeMembership !== null) {
    const { data: firstOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("tenant_id", activeMembership.tenantId)
      .order("name")
      .limit(1)
      .maybeSingle();

    if (firstOrg) {
      activeTenant = {
        tenantId: activeMembership.tenantId,
        organizationId: firstOrg.id,
        facilityIds: []
      };
    }
  }

  return {
    ok: true,
    context: {
      actor: {
        id: profile?.id ?? user.id,
        email: profile?.email ?? user.email ?? "unknown@healthscope.local",
        fullName: profile?.full_name ?? null
      },
      memberships: membershipRecords,
      activeTenant
    }
  };
}

export async function requireSession(request?: NextRequest) {
  const result = await resolveSessionContext(request);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    context: result.context,
    payload: buildSessionPayload(result.context)
  };
}

export async function requireTenantAccess(tenantId: string, request?: NextRequest) {
  const result = await requireSession(request);

  if (!result.ok) {
    return result;
  }

  if (!getAccessibleTenantIds(result.context).includes(tenantId)) {
    return {
      ok: false as const,
      code: "TENANT_ACCESS_DENIED",
      message: "The signed-in user does not have access to the requested tenant.",
      status: 403
    };
  }

  return result;
}
