"use client";

import { useState } from "react";

type ExportParams = {
  days: number;
  organizationId?: string | null;
  facilityId?: string | null;
};

type ApiOverview = {
  data?: {
    summary?: Record<string, number>;
    clinical?: Record<string, number>;
    financial?: Record<string, number>;
    quality?: Record<string, number>;
    operational?: Record<string, number>;
  } | null;
  error?: { message?: string } | null;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function overviewToCsv(data: NonNullable<ApiOverview["data"]>): string {
  const rows: string[][] = [["Section", "Metric", "Value"]];
  const sections: Array<[string, Record<string, number>]> = [
    ["Summary", data.summary ?? {}],
    ["Clinical", data.clinical ?? {}],
    ["Financial", data.financial ?? {}],
    ["Quality", data.quality ?? {}],
    ["Operational", data.operational ?? {}]
  ];
  for (const [section, obj] of sections) {
    for (const [metric, value] of Object.entries(obj)) {
      rows.push([section, metric, String(value)]);
    }
  }
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

function buildExportUrl(params: ExportParams): string {
  const search = new URLSearchParams();
  search.set("days", String(params.days));
  if (params.organizationId) search.set("organizationId", params.organizationId);
  if (params.facilityId) search.set("facilityId", params.facilityId);
  return `/api/v1/analytics/overview?${search.toString()}`;
}

export function ExportAnalyticsButton({
  days,
  organizationId = null,
  facilityId = null,
  className = "inline-flex items-center justify-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
}: {
  days: number;
  organizationId?: string | null;
  facilityId?: string | null;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setLoading(true);
    try {
      const url = buildExportUrl({ days, organizationId, facilityId });
      const res = await fetch(url, { credentials: "include" });
      const json: ApiOverview = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message ?? "Export failed");
        return;
      }

      if (!json.data) {
        setError("No data to export");
        return;
      }

      const csv = overviewToCsv(json.data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const filename = `analytics-overview-${new Date().toISOString().slice(0, 10)}.csv`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={loading}
        className={className}
      >
        {loading ? "Exporting…" : "Export data"}
      </button>
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
