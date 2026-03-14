export function FeedbackBanner({
  tone,
  message
}: {
  tone: "success" | "error";
  message: string;
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
