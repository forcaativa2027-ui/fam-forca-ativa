
"use client";
import { useState, useEffect } from "react";
import { useRadioPlayer } from "./RadioPlayerContext";
import { useRadioConfig } from "@/hooks/use-queries";
import { ChurchIcon } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  host_name: string | null;
  cover_url: string | null;
  weekday: string | null;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function RadioPage() {
  const { state, play } = useRadioPlayer();
  const { data: config, isLoading } = useRadioConfig();
  
  // Se não houver config de rádio, não mostre player vazio
  if (!config || !config.is_enabled) {
    return null; // Ou mostrar mensagem "Rádio indisponível"
  }

  const [programs, setPrograms] = useState([]);
  const [activeCategory, setActiveCategory] = useState<string>("todos");

  useEffect(() => {
    if (config && config.is_enabled) {
      // Carregar programs do banco
      // ... (você pode chamar useRadioPrograms aqui se quiser)
      // Por enquanto, mantenha o estado vazio ou carregue dados estáticos
    }
  }, [config]);

  return config ? (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-navy">Rádio Web</h1>
        <p className="text-sm text-muted">{config.display_name || "Rádio Web"}</p>
      </div>

      {/* Apenas mostra programação se houver dados */}
      {programs.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-navy">Programação</h2>
          {programs.map((p) => (
            <div key={p.id} className="p-4 rounded border p-4 hover:border-gold">
              <div className="flex items-center gap-2">
                <ChurchIcon className="h-5 w-5 text-navy" />
                <span>{p.title}</span>
              </div>
              <p className="text-xs text-muted mt-1">{p.description || "Sem descrição"}</p>
              <p className="text-xs text-muted mt-1">
                {p.weekday && ` {p.weekday} `} {p.start_time?.slice(0,5) || "—"} – {p.end_time?.slice(0,5) || "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Player apenas se houver stream ativo */}
      {config?.stream_url && (
        <div className="mt-8">
          <h2 className="font-bold">Ouvindo Agora</h2>
          <button onClick={() => setShowPlayer(true)} className="py-2 rounded bg-gold text-navy font-semibold">Abrir Player</button>
        </div>
      )}
    </div>
  ) : (
div>{/* tela de login ou navegação normal */}</div>
  );
}
