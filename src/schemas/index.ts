import { z } from "zod";

const reqText = (label: string, min = 2) =>
  z.string({ required_error: `${label} e obrigatorio` }).trim().min(min, `${label} deve ter pelo menos ${min} caracteres`);
const optionalText = z.string().trim().optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.string({required_error:"E-mail e obrigatorio"}).email("E-mail invalido"),
  password: z.string({required_error:"Senha e obrigatoria"}).min(6, "Senha precisa ter ao menos 6 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const youtubeUrl = z.string().url("URL invalida")
  .refine((u) => /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(u), "Link do YouTube invalido");

export const sermonSchema = z.object({
  title: reqText("Titulo", 3),
  youtube_url: youtubeUrl,
  reference: optionalText, speaker: optionalText, category: optionalText,
  is_featured: z.boolean().default(false),
});
export type SermonInput = z.infer<typeof sermonSchema>;

export const eventSchema = z.object({
  title: reqText("Titulo", 3),
  starts_at: z.string().min(10, "Data e hora obrigatorias"),
  location: optionalText,
  status: z.enum(["abertas","encerradas","esgotado","em_breve"]).default("abertas"),
  registration_url: z.string().url("URL invalida").optional().or(z.literal("")),
});
export type EventInput = z.infer<typeof eventSchema>;

export const memberSchema = z.object({
  full_name: reqText("Nome completo", 3),
  email: z.string().email("E-mail invalido").optional().or(z.literal("")),
  phone: optionalText,
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida").optional().or(z.literal("")),
  life_group_id: z.string().uuid().optional().nullable(),
  journey_stage: z.enum(["visitante","novo_convertido","consolidacao","discipulado","batismo","membro_ativo","servo","lider_formacao","lider","supervisor","missionario"]).default("visitante"),
});
export type MemberInput = z.infer<typeof memberSchema>;

export const cellSchema = z.object({
  name: reqText("Nome da celula"),
  sector_id: z.string().uuid("Setor invalido"),
  address: optionalText,
  meeting_weekday: z.enum(["domingo","segunda","terca","quarta","quinta","sexta","sabado"]).optional().nullable(),
  meeting_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida (HH:MM)").optional().or(z.literal("")),
  leader_id: z.string().uuid().optional().nullable(),
  host_id: z.string().uuid().optional().nullable(),
});
export type CellInput = z.infer<typeof cellSchema>;

export const discipleshipAdminSchema = z.object({
  discipler_id: z.string().uuid("Discipulador obrigatorio"),
  disciple_id: z.string().uuid("Discipulo obrigatorio"),
  current_module: optionalText,
  notes: optionalText,
}).refine((d) => d.discipler_id !== d.disciple_id, {
  message: "Discipulador e discipulo devem ser pessoas diferentes",
  path: ["disciple_id"],
});
export type DiscipleshipAdminInput = z.infer<typeof discipleshipAdminSchema>;

export const prayerSchema = z.object({
  request: reqText("Pedido", 3),
  life_group_id: z.string().uuid().optional().nullable(),
});
export type PrayerInput = z.infer<typeof prayerSchema>;

// B2 — Conteudo institucional
export const serviceTimeSchema = z.object({
  church_id: z.string().uuid("Igreja invalida"),
  weekday: z.enum(["domingo","segunda","terca","quarta","quinta","sexta","sabado"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida (HH:MM)"),
  description: optionalText,
  sort_order: z.coerce.number().int().min(0).default(0),
});
export type ServiceTimeInput = z.infer<typeof serviceTimeSchema>;

export const dailyWordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida"),
  title: reqText("Titulo", 3),
  verse_ref: optionalText,
  verse_text: optionalText,
  reflection: optionalText,
});
export type DailyWordInput = z.infer<typeof dailyWordSchema>;

// B3 — Area do membro
export const profileEditSchema = z.object({
  full_name: reqText("Nome completo", 3),
  phone: optionalText,
});
export type ProfileEditInput = z.infer<typeof profileEditSchema>;

export const newPrayerSchema = z.object({
  request: reqText("Pedido", 3),
});
export type NewPrayerInput = z.infer<typeof newPrayerSchema>;
