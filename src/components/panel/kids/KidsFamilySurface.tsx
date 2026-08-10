"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Baby, Plus, Shield, UserPlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useMyKidsDependents, useKidsAuthorizedPersons } from "@/hooks/use-queries";
import * as Kids from "@/services/kidsIdentity";
import type { KidsDependent, GuardianRelationship, AuthorizationScope } from "@/types/domain";

const RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  mae: "Mãe", pai: "Pai", avo: "Avô", ava: "Avó", tio: "Tio", tia: "Tia", tutor_legal: "Tutor Legal", outro: "Outro",
};

/**
 * KIDS — Superfície Família (KIDS-002 §7/§8). Home do responsável:
 * crianças vinculadas + estado atual, priorizando ação simples.
 * Sem custódia ativa ainda (isso chega na próxima rodada — Sessão
 * e Check-in), então mostra o estado "fora de custódia" (§9).
 */
export function KidsFamilySurface({ churchId }: { churchId: string }) {
  const { data: me } = useMyProfile();
  const { data: dependents = [] } = useMyKidsDependents(me?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<KidsDependent | null>(null);

  if (selected) return <ChildDetail dependent={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ministério de Crianças</p>
        <h1 className="font-display text-2xl text-navy">Olá, {me?.full_name?.split(" ")[0] ?? "!"}</h1>
      </div>

      <div className="space-y-2">
        {dependents.map((d) => (
          <Card key={d.id} className="border-l-4 border-l-gold">
            <CardContent className="flex items-center justify-between pt-4">
              <button onClick={() => setSelected(d)} className="flex flex-1 items-center gap-3 text-left">
                {d.photo_url ? (
                  <img src={d.photo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-navy/10 font-bold text-navy">{d.full_name[0]}</div>
                )}
                <div>
                  <p className="font-semibold text-navy">{d.preferred_name || d.full_name}</p>
                  <p className="text-xs text-muted-foreground">Sem sessão ativa no momento</p>
                </div>
              </button>
            </CardContent>
          </Card>
        ))}
        {dependents.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Baby className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma criança cadastrada ainda.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm ? (
        <AddChildForm churchId={churchId} onClose={() => setShowForm(false)} />
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full gap-1.5"><Plus className="h-4 w-4" />Cadastrar filho(a)</Button>
      )}
    </div>
  );
}

function AddChildForm({ churchId, onClose }: { churchId: string; onClose: () => void }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState<GuardianRelationship>("mae");
  const [healthNotes, setHealthNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!fullName.trim()) return;
    setBusy(true); setErr("");
    try {
      await Kids.selfRegisterDependent(supabase, {
        church_id: churchId, full_name: fullName, preferred_name: preferredName || undefined,
        birth_date: birthDate || undefined, health_notes: healthNotes || undefined, relationship,
      });
      qc.invalidateQueries({ queryKey: ["my-kids-dependents", me?.id] });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao cadastrar");
    } finally { setBusy(false); }
  }

  return (
    <Card className="border-2 border-dashed border-gold/40 bg-gold/5">
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy">Cadastrar filho(a)</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
        <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Como prefere ser chamado(a) (opcional)" />
        <DatePicker value={birthDate} onChange={setBirthDate} placeholder="Data de nascimento" disableFuture />
        <select value={relationship} onChange={(e) => setRelationship(e.target.value as GuardianRelationship)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Textarea value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Alergias ou condições de saúde relevantes (opcional)" rows={2} />
        {err && <p className="text-xs text-destructive">{err}</p>}
        <Button onClick={save} disabled={busy || !fullName.trim()} className="w-full">{busy ? "Salvando…" : "Cadastrar"}</Button>
      </CardContent>
    </Card>
  );
}

function ChildDetail({ dependent: d, onBack }: { dependent: KidsDependent; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: persons = [] } = useKidsAuthorizedPersons(d.id);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [scope, setScope] = useState<AuthorizationScope>("permanent");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!fullName.trim()) return;
    setBusy(true);
    try {
      await Kids.selfAuthorizePerson(supabase, { dependent_id: d.id, full_name: fullName, phone: phone || undefined, relationship_label: relationshipLabel || undefined, scope });
      setFullName(""); setPhone(""); setRelationshipLabel(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["kids-authorized-persons", d.id] });
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar</button>
      <Card>
        <CardContent className="flex items-center gap-3 pt-4">
          {d.photo_url ? <img src={d.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" /> : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-navy/10 text-xl font-bold text-navy">{d.full_name[0]}</div>
          )}
          <div>
            <h2 className="font-display text-lg text-navy">{d.full_name}</h2>
            <p className="text-sm text-muted-foreground">Sem sessão ativa no momento</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold text-navy"><Shield className="h-4 w-4 text-gold" />Quem pode retirar</p>
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1"><UserPlus className="h-3.5 w-3.5" />Autorizar</Button>
          </div>
          {persons.map((p) => (
            <div key={p.id} className="rounded-md border bg-card px-2.5 py-1.5">
              <p className="text-sm font-semibold text-navy">{p.full_name} {p.relationship_label && <span className="text-xs font-normal text-muted-foreground">({p.relationship_label})</span>}</p>
            </div>
          ))}
          {persons.length === 0 && <p className="text-xs italic text-muted-foreground">Só você pode retirar {d.preferred_name || d.full_name} até autorizar mais alguém.</p>}

          {showForm && (
            <div className="rounded-md border bg-muted/10 p-2 space-y-1.5">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" className="text-xs" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className="text-xs" />
              <Input value={relationshipLabel} onChange={(e) => setRelationshipLabel(e.target.value)} placeholder="Ex: Avó, Tio, Vizinha" className="text-xs" />
              <select value={scope} onChange={(e) => setScope(e.target.value as AuthorizationScope)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">
                <option value="permanent">Permanente</option>
                <option value="temporary">Temporária</option>
                <option value="single_use">Uso único</option>
              </select>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={add} disabled={busy || !fullName.trim()}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
