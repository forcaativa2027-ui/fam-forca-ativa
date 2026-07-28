"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, BellRing, CalendarDays, ClipboardX, Heart, Target, Home, CheckCircle2, Ticket, PartyPopper, AlertTriangle, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { listPublicRegistrationEvents, listMyEventRegistrations, listMyPendingPromotions, acknowledgeEventPromotion, listMyEventChanges, acknowledgeEventChange } from "@/services/events";
import { EventSignupCard } from "@/components/shared/EventSignupCard";
import type { RegistrationEvent } from "@/types/domain";

// ── Tipos ─────────────────────────────────────────────────────
type NotifKind = "aniversario" | "sem_relatorio" | "oracao_urgente" | "visita_pastoral" | "meta_atrasada" | "evento" | "promocao" | "mudanca_evento" | "lembrete_evento";

interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  urgency: "critico" | "atencao" | "info";
  eventObj?: RegistrationEvent;
  prefill?: { full_name: string; email: string | null; phone: string | null } | null;
  registrationId?: string;
}

const KIND_CONFIG: Record<NotifKind, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  aniversario:     { icon: <CalendarDays className="h-4 w-4"/>, color:"text-pink-600",   bg:"bg-pink-50 border-pink-200",   label:"Aniversário"       },
  sem_relatorio:   { icon: <ClipboardX className="h-4 w-4"/>,  color:"text-red-600",    bg:"bg-red-50 border-red-200",     label:"Sem Relatório"     },
  oracao_urgente:  { icon: <Heart className="h-4 w-4"/>,       color:"text-red-600",    bg:"bg-red-50 border-red-200",     label:"Oração Urgente"    },
  visita_pastoral: { icon: <Home className="h-4 w-4"/>,        color:"text-yellow-600", bg:"bg-yellow-50 border-yellow-200",label:"Visita Pastoral"  },
  meta_atrasada:   { icon: <Target className="h-4 w-4"/>,      color:"text-orange-600", bg:"bg-orange-50 border-orange-200",label:"Meta Atrasada"    },
  evento:          { icon: <CalendarDays className="h-4 w-4"/>, color:"text-red-600",    bg:"bg-red-50 border-red-200",     label:"Eventos"           },
  promocao:        { icon: <PartyPopper className="h-4 w-4"/>, color:"text-emerald-600", bg:"bg-emerald-50 border-emerald-200", label:"Boas notícias"  },
  mudanca_evento:  { icon: <AlertTriangle className="h-4 w-4"/>, color:"text-orange-700", bg:"bg-orange-50 border-orange-300", label:"Mudança em evento" },
  lembrete_evento: { icon: <Clock3 className="h-4 w-4"/>,      color:"text-sky-700",     bg:"bg-sky-50 border-sky-200",     label:"Lembrete"          },
};

// ── Buscar notificações ───────────────────────────────────────
async function fetchNotifications(): Promise<Notif[]> {
  const notifs: Notif[] = [];

  const [birthdays, reliability, ctAlerts, goals] = await Promise.allSettled([
    // Aniversariantes hoje
    supabase.from("birthday_today").select("id, full_name, idade").limit(10),
    // LGs sem relatório
    supabase.from("lg_reliability_index").select("id, name, dias_sem_relatorio")
      .eq("flag_sem_relatorio_recente", true).limit(10),
    // Alertas Torre de Controle
    supabase.from("control_tower_alerts")
      .select("alert_type, lg_name, detail")
      .in("alert_type", ["oracao_urgente", "visita_pastoral"])
      .limit(10),
    // Metas em atraso
    supabase.from("goals_vs_actual")
      .select("indicator, pct_atingido, target_value")
      .lt("pct_atingido", 70)
      .eq("scope", "nacional")
      .limit(5),
  ]);

  // Aniversariantes
  if (birthdays.status === "fulfilled" && birthdays.value.data) {
    birthdays.value.data.forEach(b => notifs.push({
      id: `birth-${b.id}`,
      kind: "aniversario",
      title: `🎂 ${b.full_name}`,
      detail: `Faz ${b.idade} anos hoje!`,
      urgency: "info",
    }));
  }

  // LGs sem relatório
  if (reliability.status === "fulfilled" && reliability.value.data) {
    reliability.value.data.forEach(lg => notifs.push({
      id: `rel-${lg.id}`,
      kind: "sem_relatorio",
      title: lg.name,
      detail: lg.dias_sem_relatorio === 999
        ? "Nunca enviou relatório"
        : `Sem relatório há ${lg.dias_sem_relatorio} dias`,
      urgency: "critico",
    }));
  }

  // Alertas pastorais
  if (ctAlerts.status === "fulfilled" && ctAlerts.value.data) {
    ctAlerts.value.data.forEach((a, i) => notifs.push({
      id: `ct-${a.alert_type}-${i}`,
      kind: a.alert_type as NotifKind,
      title: a.lg_name ?? "Nacional",
      detail: a.detail,
      urgency: a.alert_type === "oracao_urgente" ? "critico" : "atencao",
    }));
  }

  // Metas atrasadas
  if (goals.status === "fulfilled" && goals.value.data) {
    const LABELS: Record<string, string> = {
      membros_ativos:"Membros Ativos", visitantes:"Visitantes", decisoes:"Decisões",
      multiplicacoes:"Multiplicações", lgs_ativos:"LGs Ativos", disc_ativos:"Discipulados",
    };
    goals.value.data.forEach((g, i) => notifs.push({
      id: `goal-${i}`,
      kind: "meta_atrasada",
      title: LABELS[g.indicator] ?? g.indicator,
      detail: `${g.pct_atingido ?? 0}% da meta atingida`,
      urgency: "atencao",
    }));
  }

  // Tudo relacionado a eventos (elegíveis, promoções, mudanças, lembretes) — consolidado
  // num bloco só, com as consultas em paralelo, pra não buscar "minhas inscrições" 2x.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("full_name,email,phone,church_id").eq("id", user.id).maybeSingle();
      const prefill = prof ? { full_name: prof.full_name, email: prof.email, phone: prof.phone } : null;

      const [visibleEvents, myRegs, promotions, changes] = await Promise.all([
        listPublicRegistrationEvents(supabase, prof?.church_id ?? null),
        listMyEventRegistrations(supabase),
        listMyPendingPromotions(supabase),
        listMyEventChanges(supabase),
      ]);

      // Eventos elegíveis (ainda não inscrito)
      const registeredIds = new Set(myRegs.filter((r) => r.status !== "cancelada").map((r) => r.event_id));
      visibleEvents.filter((e) => !registeredIds.has(e.id)).forEach((e) => notifs.push({
        id: `evento-${e.id}`,
        kind: "evento",
        title: e.name,
        detail: new Date(e.start_at).toLocaleDateString("pt-BR"),
        urgency: "critico",
        eventObj: e,
        prefill,
      }));

      // Promoções de lista de espera → confirmado
      promotions.forEach((p) => notifs.push({
        id: `promocao-${p.registration_id}`,
        kind: "promocao",
        title: `Você foi confirmado em "${p.event_name}"!`,
        detail: "Havia lista de espera e uma vaga abriu — sua inscrição já está confirmada.",
        urgency: "critico",
        registrationId: p.registration_id,
      }));

      // Mudanças em evento (data/local/cancelamento)
      changes.forEach((c) => {
        let title = "";
        let detail = "";
        if (c.change_type === "cancelado") {
          title = `Evento cancelado: "${c.event_name}"`;
          detail = c.cancellation_reason ? `Motivo: ${c.cancellation_reason}` : "O organizador cancelou este evento.";
        } else if (c.change_type === "horario") {
          title = `Mudou o horário de "${c.event_name}"`;
          detail = `De ${new Date(c.old_start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} para ${new Date(c.new_start_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`;
        } else {
          title = `Mudou o local de "${c.event_name}"`;
          detail = `Novo local: ${c.new_location ?? "verificar na página do evento"}.`;
        }
        notifs.push({ id: `mudanca-${c.registration_id}`, kind: "mudanca_evento", title, detail, urgency: "atencao", registrationId: c.registration_id });
      });

      // Lembretes (evento nas próximas 48h) — reaproveita o myRegs já buscado acima
      const now48h = Date.now() + 48 * 3_600_000;
      myRegs
        .filter((r) => r.status === "confirmada" && ["inscricoes_abertas", "em_andamento"].includes(r.event.status))
        .filter((r) => {
          const start = new Date(r.event.start_at).getTime();
          return start > Date.now() && start <= now48h;
        })
        .forEach((r) => {
          let seen = false;
          try { seen = sessionStorage.getItem(`cec-event-reminder-${r.event_id}`) === "1"; } catch { /* sem storage — sempre mostra */ }
          if (seen) return;
          const hoursLeft = Math.round((new Date(r.event.start_at).getTime() - Date.now()) / 3_600_000);
          notifs.push({
            id: `lembrete-${r.event_id}`,
            kind: "lembrete_evento",
            title: `"${r.event.name}" é em breve!`,
            detail: hoursLeft <= 1 ? "Começa daqui a pouco." : `Faltam cerca de ${hoursLeft} horas.` + (r.event.is_online && r.event.online_url ? ` Link: ${r.event.online_url}` : ""),
            urgency: "atencao",
            registrationId: r.event_id,
          });
        });
    }
  } catch { /* eventos são um extra — não derruba o resto das notificações se falhar */ }

  // Ordenar: críticos primeiro, depois atenção, depois info
  return notifs.sort((a, b) => {
    const order = { critico: 0, atencao: 1, info: 2 };
    return order[a.urgency] - order[b.urgency];
  });
}

// ── Badge de notificações ─────────────────────────────────────
export function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return (
    <div className="relative">
      <Bell className="h-5 w-5 text-muted-foreground"/>
    </div>
  );
  return (
    <div className="relative">
      <BellRing className="h-5 w-5 text-[#C9A227] animate-pulse"/>
      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {count > 9 ? "9+" : count}
      </span>
    </div>
  );
}

// ── Painel de notificações ────────────────────────────────────
export function NotificationsPanel() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications().then(n => { setNotifs(n); setLoading(false); });
    // Atualizar a cada 5 minutos
    const interval = setInterval(() => {
      fetchNotifications().then(setNotifs);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const visible = notifs.filter(n => !dismissed.has(n.id));
  const criticos = visible.filter(n => n.urgency === "critico").length;
  const atencao  = visible.filter(n => n.urgency === "atencao").length;
  const info     = visible.filter(n => n.urgency === "info").length;

  if (loading) return (
    <div className="py-10 text-center text-sm text-muted-foreground">Carregando alertas…</div>
  );

  if (visible.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500"/>
      <p className="font-semibold text-[#0E2A47]">Tudo em ordem!</p>
      <p className="text-sm text-muted-foreground">Nenhum alerta ativo no momento.</p>
      <Link href="/painel/meus-eventos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy underline">
        <Ticket className="h-3.5 w-3.5" /> Ver meus eventos inscritos
      </Link>
    </div>
  );

  return (
    <div className="space-y-4 p-1">
      <div className="flex justify-end">
        <Link href="/painel/meus-eventos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy underline">
          <Ticket className="h-3.5 w-3.5" /> Meus eventos inscritos
        </Link>
      </div>
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-red-600">{criticos}</p>
            <p className="text-xs text-muted-foreground">🔴 Críticos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-400">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{atencao}</p>
            <p className="text-xs text-muted-foreground">🟡 Atenção</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{info}</p>
            <p className="text-xs text-muted-foreground">🔵 Info</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista por categoria */}
      {(["promocao","mudanca_evento","evento","lembrete_evento","aniversario","sem_relatorio","oracao_urgente","visita_pastoral","meta_atrasada"] as NotifKind[]).map(kind => {
        const group = visible.filter(n => n.kind === kind);
        if (group.length === 0) return null;
        const cfg = KIND_CONFIG[kind];
        return (
          <div key={kind}>
            <h3 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${cfg.color}`}>
              {cfg.icon} {cfg.label} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map(n => (
                kind === "evento" && n.eventObj ? (
                  <EventSignupCard
                    key={n.id}
                    event={n.eventObj}
                    compact
                    urgent
                    showDetailsLink
                    origin="alertas"
                    prefill={n.prefill}
                    onRegistered={() => setDismissed(d => new Set([...d, n.id]))}
                  />
                ) : (
                <div key={n.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${cfg.bg}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${cfg.color}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.detail}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDismissed(d => new Set([...d, n.id]));
                      if (kind === "promocao" && n.registrationId) acknowledgeEventPromotion(supabase, n.registrationId).catch(() => {});
                      if (kind === "mudanca_evento" && n.registrationId) acknowledgeEventChange(supabase, n.registrationId).catch(() => {});
                      if (kind === "lembrete_evento" && n.registrationId) {
                        try { sessionStorage.setItem(`cec-event-reminder-${n.registrationId}`, "1"); } catch { /* sem storage — sem problema */ }
                      }
                    }}
                    className="text-muted-foreground hover:text-gray-600 shrink-0 mt-0.5"
                    title="Dispensar"
                  >
                    <CheckCircle2 className="h-4 w-4"/>
                  </button>
                </div>
                )
              ))}
            </div>
          </div>
        );
      })}

      {dismissed.size > 0 && (
        <button
          onClick={() => setDismissed(new Set())}
          className="w-full text-xs text-muted-foreground hover:text-[#0E2A47] py-2"
        >
          Restaurar {dismissed.size} alerta(s) dispensado(s)
        </button>
      )}
    </div>
  );
}

// ── Hook para contar notificações (para o badge) ──────────────
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchNotifications().then(n => setCount(n.length));
    const interval = setInterval(() => {
      fetchNotifications().then(n => setCount(n.length));
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
