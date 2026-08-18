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
});
export type RadioProgramInput = z.infer<typeof radioProgramSchema>;