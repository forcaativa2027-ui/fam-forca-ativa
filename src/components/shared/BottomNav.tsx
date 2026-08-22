"use client";
import { useEffect, useRef } from "react";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

/**
 * Barra de navegação fixa no rodapé, com rolagem horizontal —
 * arquitetura definida em "Arquitetura de Navegação — FAM FORÇA ATIVA DA MULHER".
 * Reutilizada nos 3 contextos: Público, Membro, Meu Painel.
 * Mantém o item ativo sempre visível na área de rolagem.
 */
export function BottomNav({ items, activeKey }: { items: BottomNavItem[]; activeKey: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeKey]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-navy shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-1 overflow-x-auto px-2 py-1.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`nav ::-webkit-scrollbar { display: none; }`}</style>
        {items.map((it) => {
          const active = it.key === activeKey;
          return (
            <button
              key={it.key}
              ref={active ? activeRef : undefined}
              onClick={it.onClick}
              className={`flex shrink-0 snap-center flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition ${
                active ? "bg-gold/15 text-gold" : "text-white/60 hover:text-white/90"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center">{it.icon}</span>
              <span className="whitespace-nowrap text-[10px] font-semibold">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Espaçador pra empurrar o conteúdo da página, evitando que a barra fixa cubra o rodapé real. */
export function BottomNavSpacer() {
  return <div className="h-16" />;
}
