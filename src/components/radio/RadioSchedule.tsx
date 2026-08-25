"use client";
import { useRadioSchedule } from "@/hooks/use-queries";

const MODE_LABELS: Record<string, string> = {
  automatico: "Automático", gravado: "Gravado", ao_vivo: "Ao vivo", hibrido: "Híbrido",
};

export function RadioSchedule({ churchId }: { churchId?: string | null }) {
  const { data: schedule, isLoading } = useRadioSchedule(churchId ?? null);

  if (isLoading) {
    return <p className="py-8 text-center text-muted">Carregando grade...</p>;
  }
  if (!schedule || schedule.days.length === 0) {
    return <p className="py-8 text-center text-muted">Nenhuma programação cadastrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[980px] grid-cols-7 gap-3">
        {schedule.days.map((day) => {
          const isToday = day.weekday === schedule.today;
          return (
            <div
              key={day.weekday}
              className={`flex flex-col rounded-xl border p-3 ${isToday ? "border-gold bg-gold/5" : "border-border bg-background"}`}
            >
              <div className="mb-2 border-b border-border pb-2 text-center">
                <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? "text-gold" : "text-muted"}`}>
                  {day.label}
                </p>
                {isToday && <p className="mt-0.5 text-[10px] font-bold text-navy">Hoje</p>}
              </div>
              <div className="space-y-2">
                {day.items.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted/70">Sem programas</p>
                )}
                {day.items.map((item) => (
                  <div key={`${item.program_id}-${item.date ?? item.weekday}`} className="rounded-lg border border-border p-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-navy">
                        {item.start_time?.slice(0, 5) ?? "—"}
                        {item.end_time ? `–${item.end_time.slice(0, 5)}` : ""}
                      </span>
                      {item.is_special && (
                        <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gold">
                          Especial
                        </span>
                      )}
                      {!item.is_special && item.is_recurring && (
                        <span className="rounded-full bg-navy/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-navy">
                          Rec.
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-tight text-navy">{item.title}</p>
                    {item.host_name && (
                      <p className="mt-0.5 truncate text-[10px] text-muted">{item.host_name}</p>
                    )}
                    {item.mode && (
                      <p className="mt-0.5 truncate text-[10px] text-muted/70">{MODE_LABELS[item.mode]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
