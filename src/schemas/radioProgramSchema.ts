import { z } from "zod";

export const radioProgramSchema = z.object({
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().trim().optional().or(z.literal("")),
  host_name: z.string().trim().optional().or(z.literal("")),
  cover_url: z.string().url("URL da capa inválida").optional().or(z.literal("")),
  weekday: z.enum(["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]).optional(),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().optional().or(z.literal("")),
  is_recurring: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  mode: z.enum(["automatico", "gravado", "ao_vivo", "hibrido"]).optional(),
  fallback_url: z.string().url("URL de fallback inválida").optional().or(z.literal("")),
  playlist_id: z.string().uuid("Playlist inválida").optional().or(z.literal("")),
  is_special: z.boolean().default(false),
  special_start_date: z.string().optional().or(z.literal("")),
  special_end_date: z.string().optional().or(z.literal("")),
});
export type RadioProgramInput = z.infer<typeof radioProgramSchema>;