"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BOOK_GROUPS, VT_GROUP_ORDER, NT_GROUP_ORDER } from "@/services/bibleReader";
import type { BibleBook } from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. Livros organizados por grupo
 * (Pentateuco, Históricos, Evangelhos...) em vez de uma grade
 * plana — ACA-BIB-01 §5 / ACA-BIB-04 §7.
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
        <div className="space-y-1.5">
          {groups.map((g) => {
            const key = `${label}-${g.name}`;
            const isOpen = openGroup === key;
            return (
              <div key={key} className="rounded-lg border">
                <button onClick={() => setOpenGroup(isOpen ? null : key)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-navy">
                  <span>{g.name}</span>
                  <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    {g.books.length} {g.books.length === 1 ? "livro" : "livros"}
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="grid grid-cols-2 gap-1.5 border-t p-2.5 sm:grid-cols-3">
                    {g.books.map((b) => (
                      <button key={b.abbrev.pt} onClick={() => onSelect(b)}
                        className="rounded-md border bg-card p-2 text-left text-sm text-ink hover:border-gold/50 hover:text-navy">
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
