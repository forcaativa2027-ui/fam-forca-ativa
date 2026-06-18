// Conteudo institucional (cultos, palavra, enderecos).
// Por enquanto retorna placeholders sensatos. Quando a tabela `church_info` for criada,
// trocar essas funcoes para consultar o Supabase.

import type { ServiceTime, DailyWord, Church } from "@/types/domain";

export function getDefaultServices(church: Church | null): ServiceTime[] {
  // CEC Manaus tem cultos aos domingos 08h, 16h e 18h (caderno tecnico)
  if (!church || church.name === "CEC Manaus - Sede") {
    return [
      { id:"1", church_id: church?.id ?? "", weekday:"domingo", time:"08:00", description:"Culto da manha" },
      { id:"2", church_id: church?.id ?? "", weekday:"domingo", time:"16:00", description:"Culto da tarde" },
      { id:"3", church_id: church?.id ?? "", weekday:"domingo", time:"18:00", description:"Culto da noite" },
      { id:"4", church_id: church?.id ?? "", weekday:"quarta", time:"19:30", description:"Culto de oracao e ensino" },
    ];
  }
  return [];
}

export function getTodaysWord(): DailyWord {
  // Placeholder. Substituir por consulta a tabela `daily_words` quando criada.
  const today = new Date().toISOString().slice(0,10);
  return {
    id: "placeholder",
    date: today,
    title: "Palavra do dia",
    verse_ref: "Salmos 23:1",
    verse_text: "O Senhor e o meu pastor; nada me faltara.",
    reflection: "Permita que Ele guie seu dia.",
  };
}
