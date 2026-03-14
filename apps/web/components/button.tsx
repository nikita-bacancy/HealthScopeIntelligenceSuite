"use client";

type ButtonVariant = "primary" | "secondary";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none",
  secondary:
    "rounded-full border border-slate-300/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
};

export type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  type?: "button" | "submit";
  variant?: ButtonVariant;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  children,
  className = "",
  disabled = false,
  loading = false,
  loadingLabel,
  type = "button",
  variant = "primary",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const showSpinner = loading;
  const label = showSpinner && loadingLabel != null ? loadingLabel : children;

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
      disabled={isDisabled}
      type={type}
      {...rest}
    >
      {showSpinner ? (
        <>
          <Spinner className="h-4 w-4 shrink-0 animate-spin" />
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
