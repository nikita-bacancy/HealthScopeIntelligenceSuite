"use client";

import { Toaster } from "sonner";
import { ToastProvider } from "./toast";

export function ToastShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          classNames: {
            toast: "sonner-theme-toast",
            title: "sonner-theme-title",
            description: "sonner-theme-description"
          }
        }}
      />
    </ToastProvider>
  );
}
