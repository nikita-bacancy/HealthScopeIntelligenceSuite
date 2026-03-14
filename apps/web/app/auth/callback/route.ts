import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@healthscope/auth/supabase";
import { hasSupabaseEnv } from "@healthscope/config";
import { getUserFacingMessage } from "../../../lib/user-error-messages";

function signInRedirectWithError(request: NextRequest, rawMessage: string) {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set(
    "error",
    getUserFacingMessage(new Error(rawMessage), "sign-in-url")
  );
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next") ?? "/app";
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/app";
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error) {
    return signInRedirectWithError(request, errorDescription ?? error);
  }

  if (!hasSupabaseEnv()) {
    return signInRedirectWithError(request, "Sign-in is not available.");
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return signInRedirectWithError(request, "Sign-in failed. Please try again.");
  }

  const supabase = createSupabaseServerClient(await cookies());

  if (!supabase) {
    return signInRedirectWithError(request, "Sign-in is not available.");
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return signInRedirectWithError(request, exchangeError.message);
  }

  return NextResponse.redirect(new URL(safeNextPath, request.url));
}
