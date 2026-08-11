"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * ACA-UX-001 Fase F — painel deslizante de baixo (mobile), usado
 * pra recolher ferramentas secundárias do Reader (§22/§24: painéis
 * secundários devem ser recolhíveis). Sem dependência Radix nova —
 * div com overlay + slide-up via CSS, com fechar por ESC/overlay.
 */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose} role="presentation">
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t bg-card p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-2 flex items-center justify-between">
          {title && <p className="text-sm font-bold text-navy">{title}</p>}
          <button onClick={onClose} aria-label="Fechar" className="ml-auto rounded-full p-1 hover:bg-muted/30"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
