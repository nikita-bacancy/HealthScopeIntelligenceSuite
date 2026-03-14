import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@healthscope/auth/server";
import { createSupabaseServerClient } from "@healthscope/auth/supabase";
import { hasSupabaseEnv } from "@healthscope/config";
import { organizationSeed } from "@healthscope/data-model";
import { getUserFacingMessage } from "../../../../lib/user-error-messages";

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      data: organizationSeed,
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
    return NextResponse.json({
      data: organizationSeed,
      pagination: null,
      meta: {
        version: "v1",
        source: "bootstrap-seed"
      },
      error: null
    });
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

  const { data, error } = await supabase
    .from("organizations")
    .select("id, tenant_id, name, status")
    .eq("tenant_id", session.context.activeTenant.tenantId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        data: [],
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "ORGANIZATION_LOOKUP_FAILED",
          message: getUserFacingMessage(error, "api")
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: null,
    meta: {
      version: "v1"
    },
    error: null
  });
}
