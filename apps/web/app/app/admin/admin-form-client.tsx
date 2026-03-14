"use client";

import { createContext, useContext, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/toast";
import { Button } from "../../../components/button";
import type { AdminActionResult } from "./actions";

const FormPendingContext = createContext<boolean>(false);

type AdminActionFormProps = {
  action: (formData: FormData) => Promise<AdminActionResult>;
  children: ReactNode;
  className?: string;
};

export function AdminActionForm({ action, children, className }: AdminActionFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        toast({ title: result.message, tone: "success" });
        router.refresh();
      } else {
        toast({ title: result.error, tone: "error" });
      }
    });
  }

  return (
    <FormPendingContext.Provider value={isPending}>
      <form className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}

export { FormPendingContext };

type AdminSubmitButtonProps = {
  children: ReactNode;
  loadingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary";
};

export function AdminSubmitButton({
  children,
  loadingLabel,
  className,
  variant = "primary"
}: AdminSubmitButtonProps) {
  const isPending = useContext(FormPendingContext);
  return (
    <Button
      className={className}
      loading={isPending}
      loadingLabel={loadingLabel}
      type="submit"
      variant={variant}
    >
      {children}
    </Button>
  );
}
