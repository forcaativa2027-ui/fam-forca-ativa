"use client";
import {
  LayoutDashboard, Megaphone, CalendarClock, Radio, Sparkles, BookOpen, Ticket, History, ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  useAllNews, useAllBanners, useSermons, useAllServiceTimes, useDailyWords, useRegistrationEventsAdmin,
  useContentPendingReview,
} from "@/hooks/use-queries";
import type { TabKey } from "./AdminSidebar";

const WEEKDAY_TODAY_INDEX = new Date().getDay(); // 0=domingo ... 6=sábado
const WEEKDAY_MAP = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"] as const;

function KpiCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="rounded-lg border bg-card p-3 text-left transition hover:border-gold/50 hover:shadow-sm disabled:cursor-default"
    >
      <div className="flex items-center gap-2 text-gold">{icon}</div>
      <p className="mt-1.5 text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </button>
  );
}

export function EditorialDashboardAdmin({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const { data: news = [] } = useAllNews();
  const { data: banners = [] } = useAllBanners();
  const { data: sermons = [] } = useSermons();
  const { data: serviceTimes = [] } = useAllServiceTimes();
  const { data: dailyWords = [] } = useDailyWords();
  const { data: regEvents = [] } = useRegistrationEventsAdmin();
  const { data: pendingReview = [] } = useContentPendingReview();

  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const publicadosHoje = news.filter((n) =>
    n.is_published && n.published_at &&
    new Date(n.published_at).getTime() >= startOfToday.getTime() &&
    new Date(n.published_at).getTime() <= endOfToday.getTime()
  );
  const agendados = news.filter((n) => n.is_published && n.published_at && new Date(n.published_at).getTime() > now);
  const campanhasAtivas = banners.filter((b) => b.is_active);
  const eventosProximos = regEvents.filter((e) =>
    ["agendado", "inscricoes_abertas"].includes(e.status) &&
    new Date(e.start_at).getTime() >= now &&
    new Date(e.start_at).getTime() <= now + 7 * 86400000
  ).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const todayWeekday = WEEKDAY_MAP[WEEKDAY_TODAY_INDEX];
  const cultosHoje = serviceTimes.filter((s) => s.is_active && s.weekday === todayWeekday);

  const todayIso = new Date().toISOString().slice(0, 10);
  const palavraHoje = dailyWords.find((w) => w.date === todayIso && w.is_active);

  // "Últimas alterações" — combina os 3 tipos de conteúdo mais simples de comparar por data
  type Alteracao = { id: string; label: string; when: string; kind: string };
  const alteracoes: Alteracao[] = [
    ...news.map((n) => ({ id: n.id, label: n.title, when: n.updated_at, kind: "Notícia" })),
    ...banners.map((b) => ({ id: b.id, label: b.title, when: b.created_at, kind: "Banner" })),
    ...sermons.map((s) => ({ id: s.id, label: s.title, when: s.published_at, kind: "Pregação" })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 6);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-gold" />Dashboard Editorial</CardTitle>
          <CardDescription>Visão consolidada de tudo que está publicado, agendado ou ativo na Central de Conteúdo</CardDescription>
        </CardHeader>
      </Card>

      {pendingReview.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-amber-600" />Pendências de revisão</CardTitle>
            <CardDescription>Conteúdo esperando aprovação de um pastor ou apóstolo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pendingReview.map((p) => {
              const tabByType: Record<string, TabKey> = { news: "news", sermons: "sermons", banners: "banners" };
              const labelByType: Record<string, string> = { news: "Notícia", sermons: "Pregação", banners: "Banner" };
              return (
                <button
                  key={`${p.entity_type}-${p.entity_id}`}
                  onClick={() => onNavigate?.(tabByType[p.entity_type] ?? "editorial-dashboard")}
                  className="flex w-full items-center justify-between rounded-md border bg-card p-2 text-left text-sm hover:bg-muted/40"
                >
                  <span>
                    <span className="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{labelByType[p.entity_type] ?? p.entity_type}</span>
                    {" "}enviado por {p.submitted_by_name ?? "alguém"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(p.submitted_at).toLocaleDateString("pt-BR")}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={<Megaphone size={18} />} label="Publicações hoje" value={publicadosHoje.length} onClick={() => onNavigate?.("news")} />
        <KpiCard icon={<CalendarClock size={18} />} label="Conteúdos agendados" value={agendados.length} onClick={() => onNavigate?.("news")} />
        <KpiCard icon={<Ticket size={18} />} label="Eventos próximos (7 dias)" value={eventosProximos.length} onClick={() => onNavigate?.("registration-events")} />
        <KpiCard icon={<Sparkles size={18} />} label="Campanhas ativas" value={campanhasAtivas.length} onClick={() => onNavigate?.("banners")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-gold" />Palavra do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {palavraHoje ? (
              <div>
                <p className="font-semibold text-navy">{palavraHoje.title}</p>
                {palavraHoje.verse_ref && <p className="text-sm text-gold">{palavraHoje.verse_ref}</p>}
                {palavraHoje.verse_text && <p className="mt-1 text-sm italic text-muted-foreground">"{palavraHoje.verse_text}"</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma palavra cadastrada pra hoje ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4 text-gold" />Cultos hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {cultosHoje.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum culto programado pra hoje.</p>
            ) : (
              <ul className="space-y-1">
                {cultosHoje.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-navy">{s.description ?? "Culto"}</span>
                    <span className="font-mono text-muted-foreground">{s.time?.slice(0, 5)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {eventosProximos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Ticket className="h-4 w-4 text-gold" />Eventos próximos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {eventosProximos.slice(0, 5).map((e) => (
              <button
                key={e.id}
                onClick={() => onNavigate?.("registration-events")}
                className="flex w-full items-center justify-between rounded-md border bg-card p-2 text-left text-sm hover:bg-muted/40"
              >
                <span className="font-medium text-navy">{e.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-gold" />Últimas alterações</CardTitle>
        </CardHeader>
        <CardContent>
          {alteracoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
          ) : (
            <ul className="divide-y">
              {alteracoes.map((a) => (
                <li key={`${a.kind}-${a.id}`} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-navy">{a.label}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded border px-1.5 py-0.5 uppercase">{a.kind}</span>
                    {new Date(a.when).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
