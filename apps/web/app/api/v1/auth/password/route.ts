import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@healthscope/auth/supabase";
import { getUserFacingMessage } from "../../../../../lib/user-error-messages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const newPassword = String(body.password ?? "").trim();

    if (!email || !newPassword) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "BAD_REQUEST", message: "Email and password are required." }
        },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "SERVICE_KEY_MISSING", message: getUserFacingMessage(new Error("service role"), "api") }
        },
        { status: 503 }
      );
    }

    const client = createSupabaseAdminClient();
    if (!client) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "ADMIN_CLIENT_UNAVAILABLE", message: getUserFacingMessage(new Error("admin client"), "api") }
        },
        { status: 503 }
      );
    }

    const { data: users, error: listErr } = await client.auth.admin.listUsers({ perPage: 1000 });

    if (listErr) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "USER_LOOKUP_FAILED", message: getUserFacingMessage(listErr, "api") }
        },
        { status: 500 }
      );
    }

    const user = users?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "USER_NOT_FOUND", message: "No user found for that email." }
        },
        { status: 404 }
      );
    }

    const { error: updateErr } = await client.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    });

    if (updateErr) {
      return NextResponse.json(
        {
          data: null,
          pagination: null,
          meta: { version: "v1" },
          error: { code: "PASSWORD_UPDATE_FAILED", message: getUserFacingMessage(updateErr, "api") }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { email },
      pagination: null,
      meta: { version: "v1" },
      error: null
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        pagination: null,
        meta: { version: "v1" },
        error: { code: "UNKNOWN", message: getUserFacingMessage(error, "api") }
      },
      { status: 500 }
    );
  }
}
