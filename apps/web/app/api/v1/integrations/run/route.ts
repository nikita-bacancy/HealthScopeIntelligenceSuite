import { NextResponse } from "next/server";
import { requireSession } from "@healthscope/auth/server";
import { processQueuedJobs } from "../../../../../lib/job-runner";
import { getUserFacingMessage } from "../../../../../lib/user-error-messages";

function requireRunnerToken(request: Request) {
  const expected = process.env.RUNNER_TOKEN;
  if (!expected) return;
  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : "";
  if (expected && token !== expected) {
    const err = new Error("Unauthorized runner token.");
    // @ts-expect-error status not typed
    err.status = 401;
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    requireRunnerToken(request);
  } catch {
    return NextResponse.json(
      {
        data: null,
        pagination: null,
        meta: { version: "v1" },
        error: { code: "UNAUTHORIZED", message: "Runner token missing or invalid." }
      },
      { status: 401 }
    );
  }

  const session = await requireSession();

  if (!session.ok) {
    return NextResponse.json(
      {
        data: null,
        pagination: null,
        meta: { version: "v1" },
        error: { code: session.code, message: session.message }
      },
      { status: session.status }
    );
  }

  try {
    const result = await processQueuedJobs(session.context);

    return NextResponse.json({
      data: result,
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
        error: {
          code: "JOB_RUN_FAILED",
          message: getUserFacingMessage(error, "api")
        }
      },
      { status: 500 }
    );
  }
}
