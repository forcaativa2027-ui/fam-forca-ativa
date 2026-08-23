"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Shield, ShieldOff, Trash2, UserPlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/DatePicker";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useKidsDependents, useKidsGroups, useKidsGuardians, useKidsAuthorizedPersons } from "@/hooks/use-queries";
import * as Kids from "@/services/kidsIdentity";
import type { KidsDependent, GuardianRelationship, AuthorizationScope } from "@/types/domain";
import { RELATIONSHIP_LABELS, SCOPE_LABELS, STATUS_LABELS, STATUS_COLOR, calcAge } from "./KidsTypes";

/**
 * KIDS — Cadastro de Crianças (Dependent). Ao abrir uma criança,
 * mostra Responsáveis (Guardian) e Pessoas Autorizadas pra
 * retirada — são coisas DIFERENTES, cada uma com sua seção própria,
 * conforme RN-006/007.
 */
export function KidsDependentsTab({ churchId }: { churchId: string }) {
  const { data: dependents = [] } = useKidsDependents(churchId);
  const { data: groups = [] } = useKidsGroups(churchId);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<KidsDependent | null>(null);

  return (
    <div className="space-y-3">
      {!selected && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nova criança</Button>
          </div>
          {showForm && <DependentForm churchId={churchId} groups={groups} onClose={() => setShowForm(false)} />}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dependents.map((d) => (
              <button key={d.id} onClick={() => setSelected(d)} className="text-left">
                <Card className="h-full transition hover:shadow-md">
                  <CardContent className="flex items-center gap-3 pt-4">
                    {d.photo_url ? (
                      <img src={d.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy/10 text-lg font-bold text-navy">{d.full_name[0]}</div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{d.preferred_name || d.full_name}</p>
                      <p className="text-xs text-muted-foreground">{calcAge(d.birth_date)}</p>
                      {(d.health_notes || d.special_needs) && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700"><AlertTriangle className="h-3 w-3" />Atenção especial</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
            {dependents.length === 0 && <p className="col-span-full py-6 text-center text-sm italic text-muted-foreground">Nenhuma criança cadastrada ainda.</p>}
          </div>
        </>
      )}

      {selected && <DependentDetail dependent={selected} onBack={() => setSelected(null)} />}
    </div>
  );
}

function DependentForm({ churchId, groups, onClose }: { churchId: string; groups: { id: string; name: string }[]; onClose: () => void }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [groupId, setGroupId] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!fullName.trim()) return;
    setBusy(true);
    try {
      await Kids.createDependent(supabase, {
        church_id: churchId, full_name: fullName, preferred_name: preferredName || undefined,
        birth_date: birthDate || undefined, default_group_id: groupId || undefined,
        health_notes: healthNotes || undefined, special_needs: specialNeeds || undefined, created_by: me?.id,
      });
      qc.invalidateQueries({ queryKey: ["kids-dependents", churchId] });
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy">Nova criança</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
        <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="Como prefere ser chamada (opcional)" />
        <DatePicker value={birthDate} onChange={setBirthDate} placeholder="Data de nascimento" disableFuture />
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Turma (opcional)</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <Textarea value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="Alergias, condições de saúde relevantes (informado pelo responsável)" rows={2} />
        <Textarea value={specialNeeds} onChange={(e) => setSpecialNeeds(e.target.value)} placeholder="Necessidades especiais (opcional)" rows={2} />
        <Button onClick={save} disabled={busy || !fullName.trim()} className="w-full">{busy ? "Salvando…" : "Cadastrar criança"}</Button>
      </CardContent>
    </Card>
  );
}

function DependentDetail({ dependent: d, onBack }: { dependent: KidsDependent; onBack: () => void }) {
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar</button>
      <Card>
        <CardContent className="flex items-center gap-3 pt-4">
          {d.photo_url ? (
            <img src={d.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-navy/10 text-2xl font-bold text-navy">{d.full_name[0]}</div>
          )}
          <div>
            <h3 className="font-display text-lg text-navy">{d.full_name}</h3>
            <p className="text-sm text-muted-foreground">{calcAge(d.birth_date)}</p>
          </div>
        </CardContent>
      </Card>

      {(d.health_notes || d.special_needs) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="space-y-1 pt-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800"><AlertTriangle className="h-3.5 w-3.5" />Cuidados especiais</p>
            {d.health_notes && <p className="text-sm text-amber-900"><b>Saúde:</b> {d.health_notes}</p>}
            {d.special_needs && <p className="text-sm text-amber-900"><b>Necessidades:</b> {d.special_needs}</p>}
          </CardContent>
        </Card>
      )}

      <GuardiansSection dependentId={d.id} />
      <AuthorizedPersonsSection dependentId={d.id} />
    </div>
  );
}

function GuardiansSection({ dependentId }: { dependentId: string }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const { data: guardians = [] } = useKidsGuardians(dependentId);
  const [showForm, setShowForm] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [relationship, setRelationship] = useState<GuardianRelationship>("mae");

  async function add() {
    if (!profileId.trim()) return;
    await Kids.addGuardian(supabase, { dependent_id: dependentId, profile_id: profileId, relationship });
    setProfileId(""); setShowForm(false);
    qc.invalidateQueries({ queryKey: ["kids-guardians", dependentId] });
  }
  async function remove(id: string) {
    if (!confirm("Remover esse responsável?")) return;
    await Kids.removeGuardian(supabase, id);
    qc.invalidateQueries({ queryKey: ["kids-guardians", dependentId] });
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-navy"><Shield className="h-4 w-4 text-gold" />Responsáveis</p>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1"><UserPlus className="h-3.5 w-3.5" />Adicionar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Vínculo de responsabilidade — não é, por si só, autorização de retirada.</p>

        {guardians.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5">
            <span className="text-sm text-ink">{g.profile_name ?? g.profile_id} <span className="text-xs text-muted-foreground">— {RELATIONSHIP_LABELS[g.relationship]}{g.is_primary ? " (principal)" : ""}</span></span>
            <button onClick={() => remove(g.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
          </div>
        ))}
        {guardians.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum responsável vinculado ainda.</p>}

        {showForm && (
          <div className="rounded-md border bg-muted/10 p-2 space-y-1.5">
            <Input value={profileId} onChange={(e) => setProfileId(e.target.value)} placeholder="ID do perfil do responsável (profile_id)" className="text-xs" />
            <select value={relationship} onChange={(e) => setRelationship(e.target.value as GuardianRelationship)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">
              {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={add} disabled={!profileId.trim()}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuthorizedPersonsSection({ dependentId }: { dependentId: string }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const { data: persons = [] } = useKidsAuthorizedPersons(dependentId);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [scope, setScope] = useState<AuthorizationScope>("permanent");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!fullName.trim() || !me?.id) return;
    setBusy(true);
    try {
      await Kids.addAuthorizedPerson(supabase, {
        dependent_id: dependentId, authorized_by: me.id, full_name: fullName,
        phone: phone || undefined, document_number: document || undefined,
        relationship_label: relationshipLabel || undefined, scope,
      });
      setFullName(""); setPhone(""); setDocument(""); setRelationshipLabel(""); setShowForm(false);
      qc.invalidateQueries({ queryKey: ["kids-authorized-persons", dependentId] });
    } finally { setBusy(false); }
  }
  async function revoke(id: string) {
    if (!me?.id || !confirm("Revogar essa autorização?")) return;
    await Kids.revokeAuthorizedPerson(supabase, id, me.id);
    qc.invalidateQueries({ queryKey: ["kids-authorized-persons", dependentId] });
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-navy"><ShieldOff className="h-4 w-4 text-gold" />Pessoas Autorizadas pra Retirada</p>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1"><UserPlus className="h-3.5 w-3.5" />Autorizar</Button>
        </div>
        <p className="text-xs text-muted-foreground">Parentesco não é autorização — só quem estiver aqui pode retirar a criança.</p>

        {persons.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border bg-card px-2.5 py-1.5">
            <div>
              <span className="text-sm font-semibold text-navy">{p.full_name}</span>
              {p.relationship_label && <span className="ml-1.5 text-xs text-muted-foreground">({p.relationship_label})</span>}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_COLOR[p.status]}`}>{STATUS_LABELS[p.status]}</span>
              <p className="text-[11px] text-muted-foreground">{SCOPE_LABELS[p.scope]}{p.phone ? ` · ${p.phone}` : ""}</p>
            </div>
            {p.status === "active" && <button onClick={() => revoke(p.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>}
          </div>
        ))}
        {persons.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhuma pessoa autorizada ainda.</p>}

        {showForm && (
          <div className="rounded-md border bg-muted/10 p-2 space-y-1.5">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" className="text-xs" />
            <div className="grid grid-cols-2 gap-1.5">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className="text-xs" />
              <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/RG (opcional)" className="text-xs" />
            </div>
            <Input value={relationshipLabel} onChange={(e) => setRelationshipLabel(e.target.value)} placeholder="Ex: Tio, Vizinha, Motorista" className="text-xs" />
            <select value={scope} onChange={(e) => setScope(e.target.value as AuthorizationScope)} className="h-8 w-full rounded-md border bg-background px-2 text-xs">
              {Object.entries(SCOPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={add} disabled={busy || !fullName.trim()}>{busy ? "Salvando…" : "Autorizar"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
