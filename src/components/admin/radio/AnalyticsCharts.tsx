"use client";

export interface BarDatum {
  label: string;
  value: number;
}

export function fmtDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function fmtMin(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${String(m % 60).padStart(2, "0")}m`;
  }
  return `${m}min`;
}

export function BarChart({ data, height = 140 }: { data: BarDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 40 ? 5 : data.length > 20 ? 2 : 1;
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const h = max > 0 ? Math.max(2, Math.round((d.value / max) * 100)) : 0;
        const showLabel = data.length <= 40 && i % step === 0;
        return (
          <div key={i} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value} plays`}>
            <span className="mb-0.5 hidden text-[9px] text-muted-foreground group-hover:block">{d.value}</span>
            <div
              className="w-full rounded-t bg-gold/70 transition group-hover:bg-gold"
              style={{ height: `${h}%`, minHeight: 2 }}
            />
            {showLabel && <span className="mt-1 -rotate-45 text-[9px] text-muted-foreground whitespace-nowrap">{d.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function HBarList({ data, maxBars = 10 }: { data: BarDatum[]; maxBars?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const rows = data.slice(0, maxBars);
  return (
    <div className="space-y-2">
      {rows.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-navy">{d.label}</span>
            <span className="font-semibold text-navy">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gold/70" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}