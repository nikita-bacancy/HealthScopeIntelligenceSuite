"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

export type SubmitButtonProps = Omit<ButtonProps, "type" | "loading" | "loadingLabel"> & {
  loadingLabel?: string;
};

/**
 * Use inside a <form> that uses a server action. Shows a loader while the form is submitting.
 */
export function SubmitButton({ children, loadingLabel, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button loading={pending} loadingLabel={loadingLabel} type="submit" {...rest}>
      {children}
    </Button>
  );
}
