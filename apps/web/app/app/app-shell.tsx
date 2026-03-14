"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AppShellProps = {
  desktopSidebar: React.ReactNode;
  mobileSidebar: React.ReactNode;
  children: React.ReactNode;
};

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppShell({ desktopSidebar, mobileSidebar, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <>
      {/* Mobile header: visible only below xl */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur xl:hidden">
        <button
          type="button"
          aria-expanded={drawerOpen}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100/90 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          onClick={() => setDrawerOpen(true)}
        >
          <HamburgerIcon className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
          HealthScope Analytics
        </span>
      </header>

      {/* Mobile drawer: overlay + panel */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-30 xl:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[85vw] overflow-y-auto rounded-r-[24px] border border-slate-200/70 border-l-0 bg-white/78 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur transition-transform">
            <div className="flex items-center justify-between border-b border-slate-200/70 p-4">
              <span className="text-sm font-semibold text-slate-700">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {mobileSidebar}
            </div>
          </div>
        </div>
      ) : null}

      {/* Main layout: grid on xl, single column below */}
      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-stretch">
        {/* Desktop sidebar: hidden below xl */}
        <div className="hidden xl:block [&>aside]:min-h-0">
          {desktopSidebar}
        </div>
        <section className="grid gap-4 sm:gap-6">{children}</section>
      </div>
    </>
  );
}
