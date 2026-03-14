"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  title?: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((options: ToastOptions) => {
    const {
      title,
      description,
      tone = "info",
      durationMs = 5000
    } = options;
    const message = title ?? description ?? "";
    const opts = {
      description: title && description ? description : undefined,
      duration: durationMs
    };

    switch (tone) {
      case "success":
        sonnerToast.success(message, opts);
        break;
      case "error":
        sonnerToast.error(message, opts);
        break;
      case "warning":
        sonnerToast.warning(message, opts);
        break;
      default:
        sonnerToast(message, opts);
    }
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return ctx;
}
