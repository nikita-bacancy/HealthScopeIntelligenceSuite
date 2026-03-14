"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@healthscope/auth/browser";
import { Button } from "./button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const loading = isSigningOut || isPending;

  async function onSignOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      router.push("/sign-in");
      return;
    }

    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      startTransition(() => {
        router.push("/sign-in");
        router.refresh();
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Button
      className="w-full"
      loading={loading}
      loadingLabel="Signing out..."
      type="button"
      variant="secondary"
      onClick={() => void onSignOut()}
    >
      Sign out
    </Button>
  );
}
