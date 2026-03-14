import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@healthscope/auth/server";
import { getAnalyticsOverview } from "../../../../../lib/analytics";
import { getUserFacingMessage } from "../../../../../lib/user-error-messages";

function parseDays(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

  if (!session.ok) {
    return NextResponse.json(
      {
        data: null,
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
        data: null,
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "TENANT_CONTEXT_REQUIRED",
          message: "An active tenant must be selected before analytics can be viewed."
        }
      },
      { status: 400 }
    );
  }

  try {
    const overview = await getAnalyticsOverview(session.context, {
      days: parseDays(request.nextUrl.searchParams.get("days")),
      organizationId: request.nextUrl.searchParams.get("organizationId"),
      facilityId: request.nextUrl.searchParams.get("facilityId")
    });

    return NextResponse.json({
      data: overview,
      pagination: null,
      meta: {
        version: "v1"
      },
      error: null
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        pagination: null,
        meta: {
          version: "v1"
        },
        error: {
          code: "ANALYTICS_OVERVIEW_FAILED",
          message: getUserFacingMessage(error, "api")
        }
      },
      { status: 500 }
    );
  }
}
