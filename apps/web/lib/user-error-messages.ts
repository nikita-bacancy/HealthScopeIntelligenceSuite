/**
 * Centralized user-facing error messages. Never expose raw error.message or
 * technical details to the UI. Use this module wherever errors are shown to users.
 */

export type ErrorContext =
  | "global"
  | "dashboard"
  | "analytics"
  | "sign-in"
  | "sign-in-url"
  | "password"
  | "admin"
  | "integrations"
  | "api";

const GENERIC_MESSAGES: Record<ErrorContext, string> = {
  global: "Something went wrong. Please try again.",
  dashboard: "We couldn't load the dashboard. Please try again.",
  analytics: "We couldn't load analytics. Please try again.",
  "sign-in": "Sign-in failed. Please check your credentials and try again.",
  "sign-in-url":
    "Sign-in failed. Please check your credentials and try again.",
  password: "We couldn't complete that request. Please try again.",
  admin: "We couldn't complete that action. Please try again.",
  integrations: "We couldn't complete that action. Please try again.",
  api: "Something went wrong. Please try again."
};

/** Known technical substrings/codes mapped to safe user messages */
const KNOWN_MESSAGE_MAP: Array<{ pattern: string | RegExp; message: string }> = [
  { pattern: "Invalid login credentials", message: "Invalid email or password." },
  { pattern: "invalid_credentials", message: "Invalid email or password." },
  { pattern: "Email not confirmed", message: "Please confirm your email before signing in." },
  { pattern: "email_not_confirmed", message: "Please confirm your email before signing in." },
  { pattern: "USER_NOT_FOUND", message: "We couldn't find that account." },
  { pattern: "USER_LOOKUP_FAILED", message: "We couldn't complete the request. Please try again." },
  { pattern: "PASSWORD_UPDATE_FAILED", message: "We couldn't update the password. Please try again." },
  { pattern: "No user found for that email", message: "We couldn't find an account with that email." },
  { pattern: "organization is outside the active tenant", message: "That organization isn't available in your current workspace." },
  { pattern: "source is outside the active tenant", message: "That source isn't available in your current workspace." },
  { pattern: "Selected organization is outside", message: "That organization isn't available in your current workspace." },
  { pattern: "Selected source is outside", message: "That source isn't available in your current workspace." },
  { pattern: "Missing tenant or source", message: "Some required information is missing. Please try again." },
  { pattern: "Missing required fields", message: "Please fill in all required fields." },
  { pattern: "required fields", message: "Please fill in all required fields." },
  { pattern: "Supabase", message: "A service is temporarily unavailable. Please try again." },
  { pattern: "environment variables", message: "This feature is not available right now." },
  { pattern: "service role", message: "This feature is not available right now." },
  { pattern: "authorization code", message: "Sign-in failed. Please try again." },
  { pattern: "OAuth", message: "Sign-in failed. Please try again." },
];

/**
 * Returns a safe, user-facing message for the given error and context.
 * Never returns raw stack traces or technical error strings.
 */
export function getUserFacingMessage(
  error: unknown,
  context: ErrorContext = "global"
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!raw || typeof raw !== "string") {
    return GENERIC_MESSAGES[context];
  }

  const trimmed = raw.trim();
  for (const { pattern, message } of KNOWN_MESSAGE_MAP) {
    if (typeof pattern === "string") {
      if (trimmed.includes(pattern)) return message;
    } else {
      if (pattern.test(trimmed)) return message;
    }
  }

  return GENERIC_MESSAGES[context];
}

/**
 * For URL/searchParams error strings (e.g. from redirects). Sanitizes so
 * we never render technical query params as-is.
 */
export function getUserFacingMessageFromParam(
  param: string | null | undefined,
  context: ErrorContext = "sign-in-url"
): string {
  if (!param || typeof param !== "string") return GENERIC_MESSAGES[context];
  return getUserFacingMessage(new Error(param), context);
}

/**
 * Sanitize a message that might contain stack traces or multi-line errors
 * (e.g. job/event messages in integrations). Returns first line, truncated.
 */
const MAX_DISPLAY_LENGTH = 200;
const STACK_LINE_REGEX = /^\s*at\s+/m;

export function sanitizeMessageForDisplay(message: string | null | undefined): string {
  if (message == null || typeof message !== "string") return "—";
  const firstPart = message.split("\n")[0]?.trim() ?? "";
  const withoutStack = firstPart.split(STACK_LINE_REGEX)[0]?.trim() ?? firstPart;
  if (withoutStack.length <= MAX_DISPLAY_LENGTH) return withoutStack || "—";
  return `${withoutStack.slice(0, MAX_DISPLAY_LENGTH - 3)}…`;
}
