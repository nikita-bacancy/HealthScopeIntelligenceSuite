"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./button";

const FilterFormPendingContext = createContext<boolean>(false);

type FilterFormProps = {
  pathname: string;
  children: ReactNode;
  className?: string;
};

/**
 * Wraps a filter form (days, organizationId, facilityId). On submit, navigates to pathname
 * with query params and shows loading state on the submit button until navigation completes.
 */
export function FilterForm({ pathname, children, className }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const targetQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPending || targetQueryRef.current === null) return;
    const current = searchParams.toString();
    const target = targetQueryRef.current;
    const currentNorm = [...new URLSearchParams(current).entries()].sort().toString();
    const targetNorm = [...new URLSearchParams(target).entries()].sort().toString();
    if (currentNorm === targetNorm) {
      setIsPending(false);
      targetQueryRef.current = null;
    }
  }, [isPending, searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const days = formData.get("days");
    const organizationId = formData.get("organizationId");
    const facilityId = formData.get("facilityId");
    const params = new URLSearchParams();
    if (days && String(days).trim()) params.set("days", String(days).trim());
    if (organizationId && String(organizationId).trim()) params.set("organizationId", String(organizationId).trim());
    if (facilityId && String(facilityId).trim()) params.set("facilityId", String(facilityId).trim());
    const query = params.toString();
    targetQueryRef.current = query;
    setIsPending(true);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <FilterFormPendingContext.Provider value={isPending}>
      <form className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </FilterFormPendingContext.Provider>
  );
}

type FilterFormSubmitButtonProps = {
  children: ReactNode;
  loadingLabel?: string;
  className?: string;
};

export function FilterFormSubmitButton({
  children,
  loadingLabel,
  className
}: FilterFormSubmitButtonProps) {
  const isPending = useContext(FilterFormPendingContext);
  return (
    <Button className={className} loading={isPending} loadingLabel={loadingLabel} type="submit">
      {children}
    </Button>
  );
}
