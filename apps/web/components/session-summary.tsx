type SessionSummaryProps = {
  configured: boolean;
};

export function SessionSummary({ configured }: SessionSummaryProps) {
  return (
    <aside className="rounded-[28px] border border-slate-200/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Platform status</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            configured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {configured ? "Connected" : "Setup in progress"}
        </span>
      </div>
      <ul className="space-y-4">
        <li className="grid gap-1 border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0 md:grid-cols-[140px_1fr]">
          <span className="text-sm font-semibold text-slate-500">Sign-in</span>
          <span className="text-sm text-slate-700">
            {configured ? "Connected" : "Setup in progress"}
          </span>
        </li>
        <li className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[140px_1fr]">
          <span className="text-sm font-semibold text-slate-500">Access scope</span>
          <span className="text-sm text-slate-700">
            Your access is scoped to your organization and role.
          </span>
        </li>
        <li className="grid gap-1 border-t border-slate-200/70 pt-4 md:grid-cols-[140px_1fr]">
          <span className="text-sm font-semibold text-slate-500">Compliance</span>
          <span className="text-sm text-slate-700">
            Audit and compliance data are available based on your access.
          </span>
        </li>
      </ul>
    </aside>
  );
}
