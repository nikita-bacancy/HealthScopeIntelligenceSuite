"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@healthscope/auth/browser";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onSignOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      router.push("/sign-in");
      return;
    }

    await supabase.auth.signOut();

    startTransition(() => {
      router.push("/sign-in");
      router.refresh();
    });
  }

  return (
    <button
      className="flex w-full items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={() => void onSignOut()}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
