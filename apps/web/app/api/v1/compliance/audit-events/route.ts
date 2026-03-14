import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@healthscope/auth/server";
import { createSupabaseServerClient } from "@healthscope/auth/supabase";
import { createAuditEvent } from "@healthscope/compliance";
import { hasSupabaseEnv } from "@healthscope/config";
import { getUserFacingMessage } from "../../../../../lib/user-error-messages";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      data: [
        createAuditEvent({
          action: "bootstrap.audit.preview",
          actorId: "system_bootstrap",
          tenantId: "tenant_demo",
          targetType: "audit_events",
          targetId: "preview",
          outcome: "success"
        })
      ],
      pagination: null,
      meta: {
        version: "v1",
        source: "bootstrap-seed"
      },
      error: null
    });
  }

  const session = await requireSession(request);

  if (!session.ok) {
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: session.code,
          message: session.message
        }
      },
      { status: session.status }
    );
  }

  if (!session.context.activeTenant) {
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "TENANT_CONTEXT_REQUIRED",
          message: "An active tenant membership is required."
        }
      },
      { status: 403 }
    );
  }

  const supabase = createSupabaseServerClient(await cookies());

  if (!supabase) {
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "SUPABASE_NOT_CONFIGURED",
          message: getUserFacingMessage(new Error("Supabase"), "api")
        }
      },
      { status: 503 }
    );
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "25"), 100);
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, target_type, target_id, outcome, metadata, occurred_at")
    .eq("tenant_id", session.context.activeTenant.tenantId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "AUDIT_EVENTS_LOOKUP_FAILED",
          message: getUserFacingMessage(error, "api")
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: {
      nextCursor: null
    },
    meta: {
      version: "v1",
      tenantId: session.context.activeTenant.tenantId
    },
    error: null
  });
}
