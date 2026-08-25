"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useKidsGroups } from "@/hooks/use-queries";
import * as Kids from "@/services/kidsIdentity";

/** KIDS — Turmas (Group), organizadas por faixa etária. */
export function KidsGroupsTab({ churchId }: { churchId: string }) {
  const qc = useQueryClient();
  const { data: groups = [] } = useKidsGroups(churchId);
  const [name, setName] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await Kids.createGroup(supabase, {
        church_id: churchId, name,
        min_age: minAge ? Number(minAge) : undefined, max_age: maxAge ? Number(maxAge) : undefined,
      });
      setName(""); setMinAge(""); setMaxAge("");
      qc.invalidateQueries({ queryKey: ["kids-groups", churchId] });
    } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!confirm("Desativar essa turma?")) return;
    await Kids.deleteGroup(supabase, id);
    qc.invalidateQueries({ queryKey: ["kids-groups", churchId] });
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm font-bold text-navy">Nova turma</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Berçário, Kids 1)" className="sm:col-span-1" />
            <Input value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Idade mínima" type="number" />
            <Input value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="Idade máxima" type="number" />
          </div>
          <Button size="sm" onClick={add} disabled={busy || !name.trim()} className="gap-1.5"><Plus className="h-4 w-4" />Adicionar turma</Button>
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-navy">{g.name}</p>
                  {(g.min_age !== null || g.max_age !== null) && (
                    <p className="text-xs text-muted-foreground">{g.min_age ?? 0} a {g.max_age ?? "?"} anos</p>
                  )}
                </div>
              </div>
              <button onClick={() => remove(g.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && <p className="col-span-full py-6 text-center text-sm italic text-muted-foreground">Nenhuma turma cadastrada ainda.</p>}
      </div>
    </div>
  );
}
