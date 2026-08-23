"use client";
import { useEffect, useState } from "react";
import { useContentCategories, useContentTags, useContentTaxonomy } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { setContentTaxonomy } from "@/services/taxonomy";

/**
 * Uso: <TaxonomyPicker entityType="sermons" entityId={sermon?.id ?? null} />
 * Some sozinho se entityId for null (item ainda não foi salvo) — mostra depois de criar.
 * Salva automaticamente ao mudar a seleção (sem precisar de botão "salvar" separado).
 */
export function TaxonomyPicker({ entityType, entityId }: { entityType: string; entityId: string | null }) {
  const { data: categories = [] } = useContentCategories();
  const { data: tags = [] } = useContentTags();
  const { data: current } = useContentTaxonomy(entityType, entityId);
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) {
      setCategoryId(current.categories[0]?.id ?? "");
      setTagIds(current.tags.map((t) => t.id));
    }
  }, [current]);

  async function persist(nextCategoryId: string, nextTagIds: string[]) {
    if (!entityId) return;
    setSaving(true);
    try {
      await setContentTaxonomy(supabase, entityType, entityId, nextCategoryId ? [nextCategoryId] : [], nextTagIds);
    } finally { setSaving(false); }
  }

  function toggleTag(id: string) {
    const next = tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id];
    setTagIds(next);
    persist(categoryId, next);
  }

  function changeCategory(id: string) {
    setCategoryId(id);
    persist(id, tagIds);
  }

  if (!entityId) {
    return <p className="text-xs italic text-muted-foreground">Salve primeiro pra poder escolher categoria e tags.</p>;
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Categoria (opcional)</label>
        <select value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Sem categoria</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tags (opcional)</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const selected = tagIds.includes(t.id);
            return (
              <button
                key={t.id} type="button" onClick={() => toggleTag(t.id)}
                className={`rounded-full border px-2.5 py-1 text-xs ${selected ? "bg-navy text-white border-navy" : "bg-background"}`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
      {saving && <p className="text-[10px] text-muted-foreground">Salvando…</p>}
    </div>
  );
}
