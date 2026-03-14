"use client";

import { useEffect } from "react";
import { useToast } from "../components/toast";
import { getUserFacingMessage } from "../lib/user-error-messages";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { toast } = useToast();
  const message = getUserFacingMessage(error, "global");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("GlobalError:", error?.message ?? error, error?.digest);
    }
    toast({
      title: "Something went wrong",
      description: message,
      tone: "error"
    });
  }, [error, toast, message]);

  return (
    <html>
      <body className="bg-slate-50">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-6 py-8 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-amber-900">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-amber-800">
              {message}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm"
                onClick={() => reset()}
              >
                Try again
              </button>
              <button
                className="rounded-full border border-emerald-200 bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow"
                onClick={() => window.location.assign("/")}
              >
                Go home
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
