import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href="/"
          >
            Go to home
          </Link>
          <Link
            className="rounded-full border border-emerald-200 bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
            href="/app"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
