import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@healthscope/auth/server";
import { createAuditEvent } from "@healthscope/compliance";
import { hasSupabaseEnv } from "@healthscope/config";
import { getAuditEvents } from "../../../../../lib/audit-events";
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

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "25"), 100);
  const cookieStore = await cookies();
  const { data, error } = await getAuditEvents(
    cookieStore,
    session.context.activeTenant.tenantId,
    limit
  );

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
      { status: error.message.includes("not configured") ? 503 : 500 }
    );
  }

  return NextResponse.json({
    data,
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
