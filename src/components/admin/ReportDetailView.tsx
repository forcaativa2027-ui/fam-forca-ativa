"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Printer, FileDown, Calendar, MapPin, Users, Heart,
  CheckCircle2, XCircle, BookOpen, MessageCircle, Sparkles, AlertTriangle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportFull } from "@/hooks/use-queries";

const WEEKDAYS_PT: Record<string, string> = {
  domingo: "Domingo", segunda: "Segunda-feira", terca: "Terça-feira",
  quarta: "Quarta-feira", quinta: "Quinta-feira", sexta: "Sexta-feira", sabado: "Sábado",
};

export function ReportDetailView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useReportFull(reportId);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy-50">
        <p className="text-sm text-muted">Carregando relatório…</p>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy-50 p-5">
        <div className="rounded-lg border bg-card p-6 text-center max-w-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 font-display text-lg text-navy">Relatório não encontrado</p>
          <p className="mt-1 text-sm text-muted">O relatório pode ter sido apagado ou você não tem permissão para vê-lo.</p>
          <Button onClick={() => router.back()} className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" />Voltar</Button>
        </div>
      </main>
    );
  }

  const { report, cell, leader_name, reporter_name, attendance, visits } = data;
  const meetingDate = new Date(report.meeting_date + "T00:00:00");
  const attendancePresent = attendance.filter(a => a.present);
  const attendanceAbsent  = attendance.filter(a => !a.present);

  function handlePrint() { window.print(); }
  function handleExportPdf() {
    alert("No diálogo que vai abrir, escolha o destino \"Salvar como PDF\" (em vez da impressora) para baixar o relatório como arquivo PDF.");
    window.print();
  }

  return (
    <main className="min-h-screen bg-navy-50 print:bg-white">
      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1.2cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .report-page { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Barra de ações (oculta na impressão) */}
      <div className="no-print sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <Button onClick={() => router.back()} variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />Voltar
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5">
              <Printer className="h-4 w-4" />Imprimir
            </Button>
            <Button onClick={handleExportPdf} size="sm" className="gap-1.5">
              <FileDown className="h-4 w-4" />Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo do relatório */}
      <article className="report-page mx-auto my-6 max-w-4xl rounded-lg border bg-card px-8 py-8 shadow-sm print:m-0 print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="mb-6 border-b pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gold">CEC FAMILY · Relatório Semanal</p>
              <h1 className="mt-1 font-display text-3xl text-navy">{cell?.name ?? "Life Group"}</h1>
              <div className="mt-3 grid gap-1 text-sm text-muted">
                {leader_name && (
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Líder: <b className="text-navy">{leader_name}</b></div>
                )}
                {reporter_name && reporter_name !== leader_name && (
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Reportado por: <span className="text-navy">{reporter_name}</span></div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {meetingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </div>
                {cell?.meeting_weekday && cell?.meeting_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />Reunião regular: {WEEKDAYS_PT[cell.meeting_weekday] ?? cell.meeting_weekday} às {cell.meeting_time.slice(0, 5)}
                  </div>
                )}
                {cell?.address && (
                  <div className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{cell.address}</div>
                )}
              </div>
            </div>
            <FlowedBadge flowed={report.flowed} />
          </div>
        </header>

        {/* Indicadores principais (4 cards) */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Membros presentes" value={report.attendance_count} icon={<Users />} />
          <Stat label="Visitantes" value={report.visitors_count} icon={<Sparkles />} accent="gold" />
          <Stat label="Total na reunião" value={report.total_present ?? (report.attendance_count + report.visitors_count)} icon={<CheckCircle2 />} accent="green" />
          <Stat label="Decisões por Cristo" value={report.decisions_count} icon={<Heart />} accent="red" />
        </section>

        {/* Conteúdo da reunião */}
        <Section icon={<BookOpen />} title="Conteúdo da reunião">
          {report.share_theme && (
            <Row label="Tema compartilhado"><p className="text-sm">{report.share_theme}</p></Row>
          )}
          {report.bible_text && (
            <Row label="Texto bíblico"><p className="text-sm font-medium text-navy">{report.bible_text}</p></Row>
          )}
          {report.summary && (
            <Row label="Resumo da reunião"><p className="whitespace-pre-wrap text-sm">{report.summary}</p></Row>
          )}
          {!report.share_theme && !report.bible_text && !report.summary && (
            <p className="text-sm italic text-muted">Sem registro de conteúdo.</p>
          )}
        </Section>

        {/* Evangelismo */}
        <Section icon={<Sparkles />} title="Evangelismo">
          <div className="grid gap-2 sm:grid-cols-3">
            <SmallStat label="Visitas realizadas" value={report.visits_made} />
            <SmallStat label="Visitantes presentes" value={report.visitors_count} />
            <SmallStat label="Decisões" value={report.decisions_count} />
          </div>
        </Section>

        {/* Necessidades / Pedidos */}
        {report.needs && (
          <Section icon={<MessageCircle />} title="Necessidades e pedidos pastorais">
            <p className="whitespace-pre-wrap text-sm">{report.needs}</p>
          </Section>
        )}

        {/* Visitantes detalhados */}
        {visits.length > 0 && (
          <Section icon={<Sparkles />} title={`Visitantes (${visits.length})`}>
            <div className="space-y-1.5">
              {visits.map(v => (
                <div key={v.id} className="rounded-md border bg-card p-2.5">
                  <b className="text-sm text-navy">{v.visitor_name}</b>
                  {v.phone && <p className="text-xs text-muted">📱 {v.phone}</p>}
                  {v.notes && <p className="mt-1 text-xs text-muted">{v.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Lista de presença */}
        {attendance.length > 0 && (
          <Section icon={<Users />} title={`Lista de presença (${attendancePresent.length}/${attendance.length})`}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {attendance.map(a => (
                <div key={a.id} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${a.present ? "bg-green-50/50 border-green-200" : "bg-red-50/30 border-red-100"}`}>
                  {a.present
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                  <div className="min-w-0 flex-1">
                    <span className={a.present ? "text-navy" : "text-muted line-through"}>{a.member_name}</span>
                    {!a.present && a.absence_reason && (
                      <p className="text-[11px] italic text-muted">Motivo: {a.absence_reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Fluiu? */}
        {report.flowed === false && report.flowed_reason && (
          <Section icon={<AlertTriangle />} title="Observação do líder">
            <div className="rounded-md border-l-4 border-l-yellow-500 bg-yellow-50 p-3">
              <p className="text-sm">{report.flowed_reason}</p>
            </div>
          </Section>
        )}

        {/* Rodapé */}
        <footer className="mt-8 border-t pt-3 text-center text-[10px] text-muted">
          Relatório gerado pelo CEC FAMILY · Criado em {new Date(report.created_at).toLocaleString("pt-BR")}
        </footer>
      </article>
    </main>
  );
}

// ============================================================
// Subcomponentes
// ============================================================
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-navy-600">
        <span className="text-gold">{icon}</span>{title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: "gold"|"green"|"red" }) {
  const accentClass = accent === "gold" ? "border-gold/40 bg-gold/5"
                    : accent === "green" ? "border-green-200 bg-green-50"
                    : accent === "red" ? "border-red-200 bg-red-50"
                    : "border-border bg-card";
  return (
    <div className={`rounded-lg border p-3 ${accentClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      </div>
      <p className="mt-1 font-display text-3xl text-navy">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xl font-bold text-navy">{value}</p>
    </div>
  );
}

function FlowedBadge({ flowed }: { flowed: boolean | null }) {
  if (flowed === null) return null;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
      flowed ? "border-green-300 bg-green-50 text-green-700" : "border-yellow-300 bg-yellow-50 text-yellow-700"
    }`}>
      {flowed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {flowed ? "A reunião fluiu" : "Reunião teve dificuldades"}
    </span>
  );
}
