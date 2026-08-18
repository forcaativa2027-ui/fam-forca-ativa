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
  const { data: config, isLoading } = useRadioConfig();
  const { state, play } = useRadioPlayer();
  const [showPlayer, setShowPlayer] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);

  // Se não houver config de rádio, não mostre nada complexo
  if (!config || !config.is_enabled) {
    return null;
  }

  // Dados dos programas (você pode buscar do banco ou usar estado)
  const [programs, setPrograms] = useState<
    Array<{
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
    }>
  >([]);

  useEffect(() => {
    // Aqui buscaria do banco, mas para já mantenhamos estado vazio
    // para não sobrecarregar o build com lógica complexa de API
    // setPrograms([/* dados do banco */]);
  }, [config]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy">
            Rádio Web
          </h1>
          {config.display_name && (
            <p className="mt-2 text-muted">{config.display_name}</p>
          )}
        </header>

        {/* Área de Programação */}
        {showPrograms && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-navy">
              Programação
            </h2>
            {/* Mostra programação se houver dados */}
            {/* temporarily hidden until data is ready */}
            {false && (
              <div>
                <p className="text-muted">Programação em breve...</p>
              </div>
            )}
          </div>
        )}

        {/* Player que aparece quando usuário clica */}
        {showPlayer && (
          <div className="mt-8 p-6 rounded-lg bg-gray-50">
            <h2 className="font-bold">Ouvindo Agora</h2>
            <button
              onClick={() => setShowPlayer(false)}
              className="btn-close"
            >
              Fechar
            </button>
            <p>{/* Player content seria inserido aqui */}</p>
            <p>Stream ativo: {config.display_name}</p>
          </div>
        )}

        {/* Área de navegação normal */}
        <div>
          <p>Área de navegação normal do site</p>
        </div>
      </div>
    </div>
  );
};
