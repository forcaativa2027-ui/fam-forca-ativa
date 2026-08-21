"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/card";
import type { TabKey } from "../AdminSidebar";
import type { ExplorerItem } from "./explorerConfig";
import { EXPLORER_GROUP_ICONS, EXPLORER_GROUP_LABELS, EXPLORER_MAP } from "./explorerConfig";

interface Crumb {
  label: string;
  items: ExplorerItem[];
}

export function SubmenuExplorer({
  groupId, onNavigate, onClose,
}: {
  groupId: string;
  onNavigate: (tab: TabKey) => void;
  onClose: () => void;
}) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ label: EXPLORER_GROUP_LABELS[groupId] ?? groupId, items: EXPLORER_MAP[groupId] ?? [] }]);

  const level = crumbs[crumbs.length - 1];

  function openChildren(items: ExplorerItem[], label: string) {
    setCrumbs((c) => [...c, { label, items }]);
  }

  function goTo(index: number) {
    setCrumbs((c) => c.slice(0, index + 1));
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-card border-l border-border">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 border-b bg-navy px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <span className="text-gold">{EXPLORER_GROUP_ICONS[groupId]}</span>
          <h3 className="truncate font-display text-sm font-bold">{EXPLORER_GROUP_LABELS[groupId] ?? "Menu"}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Fechar painel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Breadcrumb */}
      {crumbs.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2 text-xs text-muted">
          {crumbs.map((c, i) => (
            <span key={`${i}-${c.label}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-muted" />}
              <button
                onClick={() => goTo(i)}
                className={cn(
                  "rounded px-1.5 py-0.5 transition-colors",
                  i === crumbs.length - 1 ? "font-semibold text-navy" : "text-muted hover:bg-muted hover:text-navy",
                )}
              >
                {c.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {level.label} — {level.items.length} {level.items.length === 1 ? "opção" : "opções"}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {level.items.map((item) => (
            <Card
              key={item.key}
              onClick={() => (item.children ? openChildren(item.children, item.label) : (onNavigate(item.key), onClose()))}
              className={cn(
                "border-l-4 border-gold hover:shadow-xl hover:-translate-y-1 hover:ring-gold/40 transition",
                "group cursor-pointer",
              )}
            >
              <div className="flex items-center gap-3 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy transition-colors group-hover:bg-gold/15 group-hover:text-gold">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">{item.label}</p>
                  <p className="mt-1 text-[11px] text-muted">{item.description}</p>
                </div>
                {item.children ? (
                  <span className="text-gold text-[10px] font-semibold">
                    <FolderOpen size={12} /> {item.children.length} submenus
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
        {level.items.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted">
            Nenhum submenu disponível nesta seção.
          </p>
        )}
      </div>

      {/* Rodapé */}
      {crumbs.length > 1 && (
        <div className="border-t p-3">
          <button
            onClick={() => goTo(crumbs.length - 2)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-navy hover:bg-muted transition-colors"
          >
            <ChevronLeft size={14} /> Voltar para {crumbs[crumbs.length - 2].label}
          </button>
        </div>
      )}
    </aside>
  );
}