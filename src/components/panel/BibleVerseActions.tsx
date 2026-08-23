"use client";
import { useState } from "react";
import {
  Highlighter, MessageSquarePlus, Bookmark, BookmarkCheck, Copy, Share2, BookHeart, Volume2, X, Check,
} from "lucide-react";

export interface VerseSelection { start: number; end: number }

const HIGHLIGHT_OPTIONS: { color: string; label: string; swatch: string }[] = [
  { color: "gold", label: "Promessa", swatch: "bg-gold" },
  { color: "blue", label: "Ensino", swatch: "bg-blue-400" },
  { color: "green", label: "Oração", swatch: "bg-green-400" },
  { color: "pink", label: "Família", swatch: "bg-pink-400" },
  { color: "purple", label: "Liderança", swatch: "bg-purple-400" },
];

/**
 * CEC Academy — Bíblia Integrada. Barra de ações que aparece
 * quando há um versículo (ou intervalo) selecionado.
 * ACA-BIB-04 §15/§16.
 */
export function BibleVerseActions({
  selection, isSaved, isHighlighted, onHighlight, onNote, onToggleSave, onCopy, onShare, onJournal, onListen, onClear,
}: {
  selection: VerseSelection;
  isSaved: boolean;
  isHighlighted: boolean;
  onHighlight: (color: string) => void;
  onNote: () => void;
  onToggleSave: () => void;
  onCopy: () => void;
  onShare: () => void;
  onJournal: () => void;
  onListen: () => void;
  onClear: () => void;
}) {
  const [showColors, setShowColors] = useState(false);
  const label = selection.start === selection.end ? `Versículo ${selection.start}` : `Versículos ${selection.start}–${selection.end}`;

  return (
    <div className="sticky bottom-3 z-20 mx-auto w-full max-w-lg rounded-xl border-2 border-gold/40 bg-card p-2.5 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-navy">{label}</span>
        <button onClick={onClear} aria-label="Limpar seleção"><X className="h-4 w-4 text-muted-foreground hover:text-navy" /></button>
      </div>

      {showColors ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {HIGHLIGHT_OPTIONS.map((opt) => (
            <button key={opt.color} onClick={() => { onHighlight(opt.color); setShowColors(false); }}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold text-navy hover:border-gold/50">
              <span className={`h-3 w-3 rounded-full ${opt.swatch}`} />{opt.label}
            </button>
          ))}
          <button onClick={() => setShowColors(false)} className="rounded-full border px-2.5 py-1.5 text-xs text-muted-foreground">Cancelar</button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
          <ActionButton icon={<Volume2 className="h-4 w-4" />} label="Ouvir" onClick={onListen} />
          <ActionButton icon={<Highlighter className="h-4 w-4" />} label="Destacar" onClick={() => setShowColors(true)} active={isHighlighted} />
          <ActionButton icon={<MessageSquarePlus className="h-4 w-4" />} label="Anotar" onClick={onNote} />
          <ActionButton icon={isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />} label={isSaved ? "Salvo" : "Salvar"} onClick={onToggleSave} active={isSaved} />
          <ActionButton icon={<BookHeart className="h-4 w-4" />} label="Diário" onClick={onJournal} />
          <ActionButton icon={<Copy className="h-4 w-4" />} label="Copiar" onClick={onCopy} />
          <ActionButton icon={<Share2 className="h-4 w-4" />} label="Compartilhar" onClick={onShare} />
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-[10px] font-semibold ${active ? "bg-gold/15 text-navy" : "text-muted-foreground hover:bg-muted/30 hover:text-navy"}`}>
      {active && label !== "Salvo" ? <Check className="h-4 w-4" /> : icon}
      {label}
    </button>
  );
}
