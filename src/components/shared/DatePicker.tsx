"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react";

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
 *
 * O mês e o ano usam listas customizadas (não <select> nativo) —
 * um <select> nativo abre sua lista suspensa com as cores do
 * sistema operacional, não da nossa marca, o que já causou um
 * problema real de contraste (texto claro sobre fundo branco).
 */
export function DatePicker({ value, onChange, placeholder = "Selecione uma data", disableFuture, disablePast, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const selected = fromISO(value);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(selected ?? today);
  const rootRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false); setYearPickerOpen(false); setMonthPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => { if (selected) setViewDate(selected); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (yearPickerOpen && activeYearRef.current) {
      activeYearRef.current.scrollIntoView({ block: "center" });
    }
  }, [yearPickerOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const yearRange = Array.from({ length: 120 }, (_, i) => today.getFullYear() + 5 - i);

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

  function pickYear(y: number) {
    setViewDate(new Date(y, month, 1));
    setYearPickerOpen(false);
  }
  function pickMonth(m: number) {
    setViewDate(new Date(year, m, 1));
    setMonthPickerOpen(false);
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
          <div className="relative mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-navy hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Mês — lista customizada, não <select> nativo */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setMonthPickerOpen((v) => !v); setYearPickerOpen(false); }}
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-bold text-navy hover:bg-navy/10"
                >
                  {MONTHS[month]} <ChevronDown className="h-3 w-3" />
                </button>
                {monthPickerOpen && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-1 max-h-56 w-40 -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-navy-900 p-1 shadow-2xl">
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => pickMonth(i)}
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                          i === month ? "bg-gold text-navy" : "text-white hover:bg-white/15"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ano — lista customizada, com bom contraste e rolagem até o ano atual */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setYearPickerOpen((v) => !v); setMonthPickerOpen(false); }}
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-1 text-sm font-bold text-navy hover:bg-navy/10"
                >
                  {year} <ChevronDown className="h-3 w-3" />
                </button>
                {yearPickerOpen && (
                  <div ref={yearListRef} className="absolute bottom-full left-1/2 z-10 mb-1 max-h-56 w-28 -translate-x-1/2 overflow-y-auto rounded-lg border border-white/10 bg-navy-900 p-1 shadow-2xl">
                    {yearRange.map((y) => (
                      <button
                        key={y}
                        ref={y === year ? activeYearRef : undefined}
                        type="button"
                        onClick={() => pickYear(y)}
                        className={`block w-full rounded-md px-3 py-2 text-center text-sm font-semibold transition ${
                          y === year ? "bg-gold text-navy" : "text-white hover:bg-white/15"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-navy hover:bg-muted">
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
