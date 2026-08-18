"use client";

import { z } from "zod";

const reqText = (label: string, min = 2) =>
  z.string({ required_error: `${label} e obrigatorio` }).trim().min(min, `${label} deve ter pelo menos ${min} caracteres`);
const optionalText = z.string().trim().optional().or(z.literal(""));

export const radioProgramSchema = z.object({
  title: reqText("Titulo", 3),
  description: optionalText,
  category: z.enum([
    "pregacao",
    "louvor",
    "devocional",
    "noticia",
    "entrevista",
    "estudo",
    "mensagem",
    "especial",
    "informacao",
  ]),
  start_time: z.string().min(1, "Horário de início é obrigatorio"),
  end_time: optionalText,
  is_live: z.boolean().default(false),
  presenter: optionalText,
  audio_url: z.string().url("URL do áudio invalido").optional(),
  thumbnail_url: z.string().url("URL da miniatura invalido").optional(),
  sort_order: z.number().int().default(0),
});
export type RadioProgramInput = z.infer<typeof radioProgramSchema>;
