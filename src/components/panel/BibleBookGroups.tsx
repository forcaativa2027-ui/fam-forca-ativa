"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ScrollText, Landmark, Music, Megaphone, MessagesSquare, BookHeart, Scroll, Mail, Mails, Telescope, ChevronDown, ChevronRight } from "lucide-react";
import { BOOK_GROUPS, VT_GROUP_ORDER, NT_GROUP_ORDER } from "@/services/bibleReader";
import { BibleCategoryCard } from "./academy/BibleToolCard";
import type { BibleBook } from "@/types/domain";

/** ACA-UX-001 §19/§20 — ícone por categoria bíblica. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Pentateuco": ScrollText, "Históricos": Landmark, "Poéticos e Sapienciais": Music,
  "Profetas Maiores": Megaphone, "Profetas Menores": MessagesSquare,
  "Evangelhos": BookHeart, "História": Scroll, "Cartas Paulinas": Mail,
  "Cartas Gerais": Mails, "Profecia": Telescope,
};

/**
 * CEC Academy — Bíblia Integrada. Livros organizados por
 * categoria, com identidade iconográfica (ACA-UX-001 §19/§20).
 * Navegação progressiva (§21) — abrir uma categoria fecha as
 * demais, nunca mostra tudo expandido ao mesmo tempo.
 */
export function BibleBookGroups({ books, onSelect }: { books: BibleBook[]; onSelect: (b: BibleBook) => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function groupedBy(testament: "VT" | "NT", order: string[]) {
    const testBooks = books.filter((b) => b.testament === testament);
    return order
      .map((groupName) => ({
        name: groupName,
        books: testBooks.filter((b) => BOOK_GROUPS[b.abbrev.pt] === groupName),
      }))
      .filter((g) => g.books.length > 0);
  }

  const vtGroups = groupedBy("VT", VT_GROUP_ORDER);
  const ntGroups = groupedBy("NT", NT_GROUP_ORDER);

  function renderTestament(label: string, groups: { name: string; books: BibleBook[] }[]) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {groups.map((g) => {
            const key = `${label}-${g.name}`;
            const isOpen = openGroup === key;
            const Icon = CATEGORY_ICON[g.name] ?? ScrollText;
            return (
              <div key={key} className={isOpen ? "sm:col-span-2" : ""}>
                <div className="relative">
                  <BibleCategoryCard vm={{ id: key, title: g.name, icon: Icon, bookCount: g.books.length }} onClick={() => setOpenGroup(isOpen ? null : key)} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                </div>
                {isOpen && (
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/10 p-2.5 sm:grid-cols-3">
                    {g.books.map((b) => (
                      <button key={b.abbrev.pt} onClick={() => onSelect(b)}
                        className="rounded-md border bg-card p-2 text-left text-sm text-ink hover:border-gold/50 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderTestament("Antigo Testamento", vtGroups)}
      {renderTestament("Novo Testamento", ntGroups)}
    </div>
  );
}
