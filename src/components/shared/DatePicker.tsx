"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["D","S","T","Q","Q","S","S"];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export interface DatePickerProps {
  value: string; // "YYYY-MM-DD" — mesmo formato do <input type="date">
  onChange: (value: string) => void;
  placeholder?: string;
  /** Bloqueia datas depois de hoje (ex: campo de nascimento). */
  disableFuture?: boolean;
  /** Bloqueia datas antes de hoje (ex: agendar algo pro futuro). */
  disablePast?: boolean;
  className?: string;
}

/**
 * Seletor de data customizado, com a identidade visual da CEC Family
 * (navy/dourado) — substitui o calendário nativo do navegador, que
 * varia de aparência entre Chrome/Safari/Firefox e não dá pra estilizar.
 */
export function DatePicker({ value, onChange, placeholder = "Selecione uma data", disableFuture, disablePast, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = fromISO(value);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(selected ?? today);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => { if (selected) setViewDate(selected); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function isDisabled(d: Date) {
    if (disableFuture && d > today) return true;
    if (disablePast && d < today) return true;
    return false;
  }

  function pick(day: number) {
    const d = new Date(year, month, day);
    if (isDisabled(d)) return;
    onChange(toISO(d));
    setOpen(false);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const displayLabel = selected
    ? selected.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : placeholder;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-gold" />
        <span className={selected ? "text-ink" : "text-muted-foreground"}>{displayLabel}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="grid h-8 w-8 place-items-center rounded-md text-navy hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <select
                value={month}
                onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))}
                className="rounded-md border-none bg-transparent text-sm font-bold text-navy focus-visible:outline-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))}
                className="rounded-md border-none bg-transparent text-sm font-bold text-navy focus-visible:outline-none"
              >
                {Array.from({ length: 110 }, (_, i) => today.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="grid h-8 w-8 place-items-center rounded-md text-navy hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="py-1 text-[11px] font-bold uppercase text-muted-foreground">{w}</span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const d = new Date(year, month, day);
              const isToday = toISO(d) === toISO(today);
              const isSelected = selected && toISO(d) === toISO(selected);
              const blocked = isDisabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={blocked}
                  onClick={() => pick(day)}
                  className={[
                    "grid h-9 w-9 place-items-center rounded-full text-sm transition",
                    blocked ? "cursor-not-allowed text-muted-foreground/30" :
                    isSelected ? "bg-gold font-bold text-navy shadow-md" :
                    isToday ? "border-2 border-gold text-navy font-semibold" :
                    "text-ink hover:bg-navy/10",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => { onChange(toISO(today)); setOpen(false); }}
            disabled={isDisabled(today)}
            className="mt-2 w-full rounded-md py-1.5 text-center text-xs font-bold text-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Hoje
          </button>
        </div>
      )}
    </div>
  );
}
