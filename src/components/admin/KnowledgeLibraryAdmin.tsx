"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Library, Plus, Trash2, X, Link2, History, BookOpen, FileText, Video, Music,
  Image as ImageIcon, Map, Newspaper, GraduationCap, Box, BarChart3, ClipboardCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useKnowledgeObjects, useKnowledgeObjectDetail, useVersionHistory, useCourses, useCourseModules, useModuleLessons } from "@/hooks/use-queries";
import * as Kl from "@/services/knowledgeLibrary";
import type { KnowledgeObject, KnowledgeObjectType, KnowledgeObjectStatus, KnowledgeObjectScope } from "@/types/domain";

const TYPE_CONFIG: Record<KnowledgeObjectType, { label: string; icon: typeof BookOpen }> = {
  biblia: { label: "Bíblia", icon: BookOpen }, livro: { label: "Livro", icon: BookOpen },
  pdf: { label: "PDF", icon: FileText }, video: { label: "Vídeo", icon: Video },
  podcast: { label: "Podcast", icon: Music }, imagem: { label: "Imagem", icon: ImageIcon },
  mapa: { label: "Mapa", icon: Map }, artigo: { label: "Artigo", icon: Newspaper },
  apostila: { label: "Apostila", icon: GraduationCap }, modelo_3d: { label: "Modelo 3D", icon: Box },
  infografico: { label: "Infográfico", icon: BarChart3 }, plano_aula: { label: "Plano de Aula", icon: ClipboardCheck },
  questionario: { label: "Questionário", icon: ClipboardCheck },
};
const STATUS_CONFIG: Record<KnowledgeObjectStatus, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700 border-gray-300" },
  em_catalogacao: { label: "Em catalogação", color: "bg-blue-100 text-blue-800 border-blue-300" },
  em_curadoria: { label: "Em curadoria", color: "bg-purple-100 text-purple-800 border-purple-300" },
  aguardando_aprovacao: { label: "Aguardando aprovação", color: "bg-amber-100 text-amber-800 border-amber-300" },
  publicado: { label: "Publicado", color: "bg-green-100 text-green-800 border-green-300" },
  atualizado: { label: "Atualizado", color: "bg-teal-100 text-teal-800 border-teal-300" },
  arquivado: { label: "Arquivado", color: "bg-gray-100 text-gray-500 border-gray-300" },
};
const SCOPE_LABELS: Record<KnowledgeObjectScope, string> = {
  global: "Global", institucional: "Institucional", local: "Local", turma: "Turma", pessoal: "Pessoal",
};

/**
 * CEC Academy Blocos 2/3 — Biblioteca (Conhecimento Integrado).
 * Catálogo de Objetos de Conhecimento com CID, curadoria/governança
 * e relacionamentos — a base que alimenta a Central de Estudos.
 */
export function KnowledgeLibraryAdmin() {
  const [typeFilter, setTypeFilter] = useState<KnowledgeObjectType | "">("");
  const [statusFilter, setStatusFilter] = useState<KnowledgeObjectStatus | "">("");
  const { data: objects = [] } = useKnowledgeObjects({ type: typeFilter || undefined, status: statusFilter || undefined });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeObject | null>(null);
  const [selected, setSelected] = useState<KnowledgeObject | null>(null);

  async function remove(id: string) {
    if (!confirm("Remover este Objeto de Conhecimento?")) return;
    await Kl.deleteKnowledgeObject(supabase, id);
    setSelected(null);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl text-navy"><Library className="h-5 w-5 text-gold" />Biblioteca — Conhecimento Integrado</h2>
          <p className="text-sm text-muted-foreground">Objetos de Conhecimento catalogados (CID), com curadoria e relacionamentos — alimenta a Central de Estudos automaticamente.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1.5"><Plus className="h-4 w-4" />Novo objeto</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as KnowledgeObjectType | "")} className="h-9 rounded-md border bg-background px-2 text-xs">
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as KnowledgeObjectStatus | "")} className="h-9 rounded-md border bg-background px-2 text-xs">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {selected ? (
        <ObjectDetailAdmin object={selected} onBack={() => setSelected(null)} onEdit={() => { setEditing(selected); setShowForm(true); }} onDelete={() => remove(selected.id)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((o) => {
            const Icon = TYPE_CONFIG[o.object_type].icon;
            return (
              <button key={o.id} onClick={() => setSelected(o)} className="text-left">
                <Card className="h-full transition hover:shadow-md">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 shrink-0 text-gold" />
                      <p className="truncate font-semibold text-navy">{o.title}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{o.cid}</p>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CONFIG[o.status].color}`}>{STATUS_CONFIG[o.status].label}</span>
                  </CardContent>
                </Card>
              </button>
            );
          })}
          {objects.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum objeto cadastrado ainda.</p>}
        </div>
      )}

      {showForm && (
        <ObjectForm editing={editing} onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); setSelected(null); }} />
      )}
    </div>
  );
}

function ObjectDetailAdmin({ object: o, onBack, onEdit, onDelete }: { object: KnowledgeObject; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useMyProfile();
  const { data: detail } = useKnowledgeObjectDetail(o.id);
  const { data: history = [] } = useVersionHistory(o.id);
  const { data: allObjects = [] } = useKnowledgeObjects();
  const [linkId, setLinkId] = useState("");
  const [curatorNotes, setCuratorNotes] = useState(o.curator_notes ?? "");

  async function changeStatus(status: KnowledgeObjectStatus) {
    await Kl.setKnowledgeObjectStatus(supabase, o.id, status, me?.id, curatorNotes || undefined);
    qc.invalidateQueries({ queryKey: ["knowledge-objects"] });
    qc.invalidateQueries({ queryKey: ["knowledge-object-detail", o.id] });
  }
  async function addRelation() {
    if (!linkId) return;
    await Kl.relateKnowledgeObjects(supabase, o.id, linkId);
    setLinkId("");
    qc.invalidateQueries({ queryKey: ["knowledge-object-detail", o.id] });
  }
  async function removeRelation(otherId: string) {
    await Kl.unrelateKnowledgeObjects(supabase, o.id, otherId);
    qc.invalidateQueries({ queryKey: ["knowledge-object-detail", o.id] });
  }

  const Icon = TYPE_CONFIG[o.object_type].icon;

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg text-navy"><Icon className="h-5 w-5 text-gold" />{o.title}</h3>
              <p className="font-mono text-xs text-muted-foreground">{o.cid} · v{o.version} · {SCOPE_LABELS[o.scope]}</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {o.description && <p className="text-sm text-ink">{o.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {o.author && <span>Autor: {o.author}</span>}
            {o.institution && <span>Instituição: {o.institution}</span>}
            {o.year && <span>Ano: {o.year}</span>}
          </div>
          {o.bible_refs && <p className="rounded-md bg-gold/10 px-2 py-1 text-xs font-semibold text-navy">📖 {o.bible_refs}</p>}

          {/* Curadoria */}
          <div className="rounded-md border p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Curadoria / Governança</p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={o.status} onChange={(e) => changeStatus(e.target.value as KnowledgeObjectStatus)} className="h-8 rounded-md border bg-background px-2 text-xs">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CONFIG[o.status].color}`}>{STATUS_CONFIG[o.status].label}</span>
            </div>
            <Textarea value={curatorNotes} onChange={(e) => setCuratorNotes(e.target.value)} placeholder="Notas do curador (opcional)" rows={2} className="mt-2 text-xs" />
          </div>

          {/* Histórico de versões */}
          {history.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"><History className="h-3.5 w-3.5" />Histórico de versões</p>
              {history.map((h: { id: string; version_number: number; changed_at: string; change_notes: string | null }) => (
                <p key={h.id} className="text-xs text-muted-foreground">v{h.version_number} · {new Date(h.changed_at).toLocaleDateString("pt-BR")}{h.change_notes ? ` — ${h.change_notes}` : ""}</p>
              ))}
            </div>
          )}

          {/* Relacionamentos */}
          <div className="border-t pt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Link2 className="h-3.5 w-3.5" />Relacionados</p>
            <div className="flex flex-wrap gap-1.5">
              {(detail?.related ?? []).map((r) => (
                <span key={r.related_id} className="flex items-center gap-1 rounded-full border bg-card px-2 py-1 text-xs">
                  {r.related_title}
                  <button onClick={() => removeRelation(r.related_id)}><X className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                </span>
              ))}
              {(detail?.related ?? []).length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum relacionamento ainda.</p>}
            </div>
            <div className="mt-2 flex gap-2">
              <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className="h-8 flex-1 rounded-md border bg-background px-2 text-xs">
                <option value="">Relacionar com…</option>
                {allObjects.filter((p) => p.id !== o.id).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <Button size="sm" onClick={addRelation} disabled={!linkId}>Vincular</Button>
            </div>
          </div>

          <LessonLinkSection objectId={o.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function LessonLinkSection({ objectId }: { objectId: string }) {
  const qc = useQueryClient();
  const { data: courses = [] } = useCourses();
  const [courseId, setCourseId] = useState("");
  const { data: modules = [] } = useCourseModules(courseId || null);
  const [moduleId, setModuleId] = useState("");
  const { data: lessons = [] } = useModuleLessons(moduleId || null);
  const [lessonId, setLessonId] = useState("");

  async function link() {
    if (!lessonId) return;
    await Kl.linkObjectToLesson(supabase, lessonId, objectId);
    qc.invalidateQueries({ queryKey: ["central-estudos", lessonId] });
    setLessonId("");
  }

  return (
    <div className="border-t pt-3">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Vincular a uma Lição (Central de Estudos)</p>
      <div className="grid grid-cols-3 gap-1.5">
        <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); setLessonId(""); }} className="h-8 rounded-md border bg-background px-1.5 text-xs">
          <option value="">Curso…</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={moduleId} onChange={(e) => { setModuleId(e.target.value); setLessonId(""); }} disabled={!courseId} className="h-8 rounded-md border bg-background px-1.5 text-xs">
          <option value="">Módulo…</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} disabled={!moduleId} className="h-8 rounded-md border bg-background px-1.5 text-xs">
          <option value="">Lição…</option>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      <Button size="sm" onClick={link} disabled={!lessonId} className="mt-1.5">Vincular a essa lição</Button>
    </div>
  );
}

function ObjectForm({ editing, onClose, onDone }: { editing: KnowledgeObject | null; onClose: () => void; onDone: () => void }) {
  const { data: me } = useMyProfile();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [objectType, setObjectType] = useState<KnowledgeObjectType>(editing?.object_type ?? "pdf");
  const [author, setAuthor] = useState(editing?.author ?? "");
  const [institution, setInstitution] = useState(editing?.institution ?? "");
  const [publisher, setPublisher] = useState(editing?.publisher ?? "");
  const [year, setYear] = useState(editing?.year?.toString() ?? "");
  const [storageUrl, setStorageUrl] = useState(editing?.storage_url ?? "");
  const [externalUrl, setExternalUrl] = useState(editing?.external_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(editing?.thumbnail_url ?? "");
  const [bibleRefs, setBibleRefs] = useState(editing?.bible_refs ?? "");
  const [license, setLicense] = useState(editing?.license ?? "");
  const [downloadAllowed, setDownloadAllowed] = useState(editing?.download_allowed ?? false);
  const [scope, setScope] = useState<KnowledgeObjectScope>(editing?.scope ?? "institucional");
  const [changeNotes, setChangeNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const payload = {
        title, description: description || undefined, object_type: objectType,
        author: author || undefined, institution: institution || undefined, publisher: publisher || undefined,
        year: year ? Number(year) : undefined,
        storage_url: storageUrl || undefined, external_url: externalUrl || undefined, thumbnail_url: thumbnailUrl || undefined,
        bible_refs: bibleRefs || undefined, license: license || undefined,
        download_allowed: downloadAllowed, scope,
      };
      if (editing) await Kl.updateKnowledgeObject(supabase, editing.id, payload, me?.id, changeNotes || undefined);
      else await Kl.createKnowledgeObject(supabase, { ...payload, status: "rascunho", created_by: me?.id });
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy">{editing ? "Editar" : "Novo"} Objeto de Conhecimento</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <select value={objectType} onChange={(e) => setObjectType(e.target.value as KnowledgeObjectType)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={2} />
        <div className="grid grid-cols-3 gap-2">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor" />
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Instituição" />
          <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Editora" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ano" type="number" />
          <select value={scope} onChange={(e) => setScope(e.target.value as KnowledgeObjectScope)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
            {Object.entries(SCOPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Input value={storageUrl} onChange={(e) => setStorageUrl(e.target.value)} placeholder="URL do arquivo (Storage)" />
        <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="Ou link externo" />
        <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Imagem de capa (URL)" />
        <Input value={bibleRefs} onChange={(e) => setBibleRefs(e.target.value)} placeholder="Referências bíblicas (ex: João 3)" />
        <Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Licença / direitos" />
        <label className="flex items-center gap-2 text-xs text-ink">
          <input type="checkbox" checked={downloadAllowed} onChange={(e) => setDownloadAllowed(e.target.checked)} />Permitir download
        </label>
        {editing && <Input value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} placeholder="O que mudou nessa versão? (opcional)" />}
        <Button onClick={save} disabled={busy || !title.trim()} className="w-full">{busy ? "Salvando…" : "Salvar"}</Button>
      </CardContent>
    </Card>
  );
}
