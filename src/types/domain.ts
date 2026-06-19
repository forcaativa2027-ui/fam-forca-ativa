/** Tipos de dominio do CEC FAMILY (espelham o schema do Supabase). */

export type UserRole = "apostolo"|"pastor"|"supervisor"|"lider"|"anfitriao"|"discipulador"|"membro"|"visitante";
export type ChurchType = "sede"|"nucleo"|"igreja_local";
export type JourneyStage = "visitante"|"novo_convertido"|"consolidacao"|"discipulado"|"batismo"|"membro_ativo"|"servo"|"lider_formacao"|"lider"|"supervisor"|"missionario";
export type MemberStatus = "ativo"|"inativo"|"afastado";
export type Weekday = "domingo"|"segunda"|"terca"|"quarta"|"quinta"|"sexta"|"sabado";
export type EventStatus = "abertas"|"encerradas"|"esgotado"|"em_breve";
export type EventTypeKind = "culto"|"congresso"|"conferencia"|"encontro"|"ebd"|"outro";
export type AttendeeKind = "membro"|"frequentador";
export type FinanceKind = "dizimo"|"oferta"|"primicia"|"missoes"|"construcao"|"outras_entradas"|"salario"|"aluguel"|"energia"|"evangelismo"|"evento"|"investimento"|"outras_saidas";
export type FinanceDirection = "entrada"|"saida";
export type DiscipleshipStatus = "ativo"|"pausado"|"concluido"|"desistente";
export type AuditAction = "insert"|"update"|"delete"|"login"|"logout"|"export"|"custom";

// B4b — Relatorios
export type WeeklyAttendanceKind = "membro" | "frequentador";
export interface MeetingReport {
  id: string; life_group_id: string; meeting_date: string; weekday: Weekday | null;
  share_theme: string | null; bible_text: string | null;
  flowed: boolean | null; flowed_reason: string | null;
  attendance_count: number; frequentadores_count: number; total_present: number | null;
  visitors_count: number; visits_made: number; decisions_count: number;
  needs: string | null; summary: string | null; created_at: string;
}
export interface MonthlyReport {
  id: string; life_group_id: string; year: number; month: number;
  nucleo: string | null; closed_at: string | null; created_at: string;
}
export interface MonthlyReportWeek {
  id: string; report_id: string; week_number: number;
  num_membros: number; memb_c_discipuladores: number;
  mda_15_dias: number; ge: number; visitantes: number;
  oferta_pix: number; oferta_especie: number;
  ebd: number; cc: number; cel: number; kg_amor: number;
}
export interface MonthlyReportMember {
  id: string; report_id: string; member_id: string;
  discipulador_id: string | null; discipulador_nome: string | null;
}
export interface MonthlyReportMemberWeek {
  id: string; monthly_report_member_id: string; week_number: number;
  mda: number; cc: number; cel: number;
}

// Finance
export interface Finance {
  id: string; church_id: string; sector_id: string | null;
  kind: FinanceKind; direction: FinanceDirection; amount: number;
  description: string | null; occurred_on: string;
  payer_name: string | null; payer_member_id: string | null;
  created_at: string;
}

export interface Church {
  id:string; name:string; type:ChurchType; parent_id:string|null;
  address:string|null; city:string|null; state:string|null;
  slug:string|null; pastor_id:string|null;
  logo_url:string|null; banner_url:string|null;
  primary_color:string|null; secondary_color:string|null;
  short_description:string|null; site_url:string|null; whatsapp_phone:string|null;
  is_active?:boolean;
}
export interface District { id:string; church_id:string; name:string; mother_id:string|null; leader_id:string|null; is_active:boolean; }
export interface Area { id:string; district_id:string; name:string; mother_id:string|null; leader_id:string|null; is_active:boolean; }
export interface Sector { id:string; area_id:string; name:string; mother_id:string|null; leader_id:string|null; is_active:boolean; }
export interface Cell {
  id:string; name:string; sector_id:string|null; church_id:string|null;
  leader_id:string|null; coleader_id:string|null; host_id:string|null; supervisor_id:string|null;
  mother_cell_id:string|null; address:string|null;
  state:string|null; city:string|null; neighborhood:string|null;
  latitude:number|null; longitude:number|null;
  meeting_weekday:Weekday|null; meeting_time:string|null; is_active:boolean;
}
export interface Profile { id:string; full_name:string; email:string|null; phone:string|null; role:UserRole; avatar_url:string|null; church_id:string|null; }
export interface Member {
  id:string; profile_id:string|null; full_name:string; email:string|null; phone:string|null;
  birth_date:string|null; life_group_id:string|null; church_id:string|null;
  journey_stage:JourneyStage; status:MemberStatus; joined_at:string|null;
}
export interface Sermon { id:string; title:string; reference:string|null; speaker:string|null; youtube_url:string; thumbnail_url:string|null; category:string|null; published_at:string; is_featured:boolean; is_published:boolean; church_id:string|null; }
export interface EventItem { id:string; title:string; description:string|null; starts_at:string; ends_at:string|null; location:string|null; image_url:string|null; registration_url:string|null; status:EventStatus; event_type:EventTypeKind; is_published:boolean; church_id:string|null; }

// M1b — Banners (Hero Carousel)
export interface Banner {
  id: string; title: string; subtitle: string | null;
  image_url: string | null; cta_label: string | null; cta_url: string | null;
  sort_order: number; is_active: boolean;
  starts_at: string | null; ends_at: string | null;
  created_at: string;
}
export interface PrayerRequest { id:string; life_group_id:string|null; member_id:string|null; request:string; is_answered:boolean; created_at:string; }
export interface Discipleship { id:string; discipler_id:string; disciple_id:string; status:DiscipleshipStatus; started_on:string; ended_on:string|null; current_module:string|null; notes:string|null; }
export type TimelineEventType = "conversao"|"batismo"|"consolidacao"|"discipulado"|"curso"|"ministerio"|"encontro"|"mudanca_etapa"|"observacao";
export interface PastoralTimeline { id:string; member_id:string; event_type:TimelineEventType; title:string; description:string|null; event_date:string; created_at:string; }
export interface AuditLog { id:string; actor_id:string|null; actor_email:string|null; action:AuditAction; entity:string; entity_id:string|null; created_at:string; }
export interface MdaMinAlert { nivel:"distrito"|"area"|"setor"; id:string; nome:string; filhos:number; }
export interface DashboardStats {
  total_members:number; total_visitors:number; total_groups:number;
  total_reports:number; baptisms:number;
  by_stage: Record<string,number>;
  reports_trend: { week:string; attendance:number; visitors:number }[];
}

/** Conteudo institucional (vindo das tabelas `church_info` e `daily_words`). */
export interface ChurchInfo {
  id: string; church_id: string; weekday: Weekday; time: string;
  description: string | null; is_active: boolean; sort_order: number;
}
export type ServiceTime = ChurchInfo; // alias usado no front
export interface DailyWord {
  id: string; date: string; title: string;
  verse_ref: string | null; verse_text: string | null; reflection: string | null;
  prayer: string | null;
  is_active: boolean;
}

// M1a — Conteudo publico e formularios
export type NewsCategory = "minha_comunidade" | "cec_manaus" | "cec_brasilia" | "geral";
export type ContactStatus = "novo" | "em_andamento" | "concluido" | "spam";
export interface News {
  id: string; slug: string; category: NewsCategory;
  title: string; summary: string | null; body: string | null;
  cover_url: string | null; author_name: string | null;
  church_id: string | null;
  is_published: boolean; published_at: string | null;
  meta_title: string | null; meta_description: string | null; og_image_url: string | null;
  created_at: string; updated_at: string;
}
export interface PublicPrayerRequest {
  id: string; full_name: string; email: string | null; phone: string | null;
  city: string | null; request: string; status: ContactStatus;
  internal_notes: string | null; church_id: string | null; created_at: string;
}
export interface VisitRequest {
  id: string; full_name: string; email: string | null; phone: string;
  city: string | null; address: string | null;
  best_time: string | null; reason: string | null;
  status: ContactStatus; internal_notes: string | null;
  church_id: string | null; created_at: string;
}
export interface PendingCounts { prayer_pending: number; visit_pending: number; }
