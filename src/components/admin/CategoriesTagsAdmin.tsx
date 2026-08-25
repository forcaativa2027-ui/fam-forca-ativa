"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag as TagIcon, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useContentCategories, useContentTags } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createContentCategory, deleteContentCategory, createContentTag, deleteContentTag } from "@/services/taxonomy";
import { logAudit } from "@/services/audit";

const SUGGESTED_COLORS = ["#0E2A47", "#C9A227", "#16A34A", "#DC2626", "#7C3AED", "#0891B2", "#EA580C"];

export function CategoriesTagsAdmin() {
  const qc = useQueryClient();
  const { data: categories = [] } = useContentCategories();
  const { data: tags = [] } = useContentTags();
  const [newCategory, setNewCategory] = useState("");
  const [newColor, setNewColor] = useState(SUGGESTED_COLORS[0]);
  const [newTag, setNewTag] = useState("");

  async function addCategory() {
    if (!newCategory.trim()) return;
    await createContentCategory(supabase, newCategory.trim(), newColor, categories.length);
    await logAudit(supabase, "insert", "content_categories", null, { name: newCategory.trim() });
    setNewCategory("");
    qc.invalidateQueries({ queryKey: ["content-categories"] });
  }

  async function removeCategory(id: string, name: string) {
    if (!confirm(`Remover a categoria "${name}"? Conteúdos que já usam ela ficam sem categoria.`)) return;
    await deleteContentCategory(supabase, id);
    await logAudit(supabase, "delete", "content_categories", id, { name });
    qc.invalidateQueries({ queryKey: ["content-categories"] });
  }

  async function addTag() {
    if (!newTag.trim()) return;
    try {
      await createContentTag(supabase, newTag.trim());
      await logAudit(supabase, "insert", "content_tags", null, { name: newTag.trim() });
      setNewTag("");
      qc.invalidateQueries({ queryKey: ["content-tags"] });
    } catch { alert("Já existe uma tag com esse nome."); }
  }

  async function removeTag(id: string, name: string) {
    if (!confirm(`Remover a tag "${name}"?`)) return;
    await deleteContentTag(supabase, id);
    await logAudit(supabase, "delete", "content_tags", id, { name });
    qc.invalidateQueries({ queryKey: ["content-tags"] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-gold" />Categorias e Tags</CardTitle>
          <CardDescription>
            Taxonomia central — quando disponível no formulário de um conteúdo, aparece pra escolher categoria e tags daqui.
            Não substitui campos que já existem (ex: público-alvo de notícias, categoria de eventos), é uma camada extra pra organizar por tema.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Nova categoria" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <select value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-14 rounded-md border" style={{ backgroundColor: newColor }} />
              <Button onClick={addCategory} size="sm" className="gap-1.5 shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="space-y-1.5">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-2.5 py-1.5">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color ?? "#999" }} />
                    {c.name}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeCategory(c.id, c.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Nova tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
              <Button onClick={addTag} size="sm" className="gap-1.5 shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t.id} className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs">
                  <TagIcon className="h-3 w-3 text-muted-foreground" /> {t.name}
                  <button onClick={() => removeTag(t.id, t.name)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
