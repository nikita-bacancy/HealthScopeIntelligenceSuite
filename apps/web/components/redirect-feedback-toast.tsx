"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast";

type RedirectFeedbackToastProps = {
  error: string | null;
  success: string | null;
};

/**
 * When the page was opened with ?success=... or ?error=..., shows that message
 * in the bottom-right toast and clears the params from the URL.
 */
export function RedirectFeedbackToast({ success, error }: RedirectFeedbackToastProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (hasShownRef.current) return;
    if (!success && !error) return;

    if (success) {
      toast({ title: success, tone: "success" });
    }
    if (error) {
      toast({ title: error, tone: "error" });
    }

    hasShownRef.current = true;

    const next = new URLSearchParams(searchParams);
    next.delete("success");
    next.delete("error");
    const q = next.toString();
    const newUrl = q ? `${pathname}?${q}` : pathname;
    setTimeout(() => router.replace(newUrl), 0);
  }, [success, error, pathname, router, searchParams, toast]);

  return null;
}
