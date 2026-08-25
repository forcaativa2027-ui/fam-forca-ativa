"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Compass, Plus, Trash2, MapPin, Landmark, Clock, Pickaxe, Users, Link2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import { useKnowledgePoints, useKnowledgePointDetail } from "@/hooks/use-queries";
import * as Kp from "@/services/knowledgePoints";
import * as Bible from "@/services/bibleReader";
import { useMyProfile } from "@/hooks/use-queries";
import type { KnowledgeCategory, KnowledgePoint, RelationType } from "@/types/domain";

/** Rótulo de um relacionamento, considerando de qual lado (direção) está sendo visto. */
export const RELATION_LABELS: Record<RelationType, { saida: string; entrada: string }> = {
  pai_de: { saida: "Pai de", entrada: "Filho(a) de" },
  mae_de: { saida: "Mãe de", entrada: "Filho(a) de" },
  conjuge_de: { saida: "Cônjuge de", entrada: "Cônjuge de" },
  contemporaneo_de: { saida: "Contemporâneo de", entrada: "Contemporâneo de" },
  local_de: { saida: "Local de", entrada: "Relacionado ao local" },
};

const CATEGORIES: { key: KnowledgeCategory; label: string; icon: typeof MapPin; question: string }[] = [
  { key: "lugar", label: "Lugares", icon: MapPin, question: "Onde aconteceu?" },
  { key: "historia_cultura", label: "História e Cultura", icon: Landmark, question: "Como era aquele mundo?" },
  { key: "linha_tempo", label: "Linha do Tempo", icon: Clock, question: "Quando aconteceu?" },
  { key: "arqueologia", label: "Arqueologia", icon: Pickaxe, question: "Quais evidências existem?" },
  { key: "personagem", label: "Personagens", icon: Users, question: "Quem participou?" },
];

/**
 * CEC Academy Bloco 4 — Exploração Inteligente do Conhecimento
 * Bíblico. Gestão dos Pontos de Conhecimento e relacionamentos.
 */
export function KnowledgePointsAdmin() {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>("lugar");
  const { data: points = [] } = useKnowledgePoints(activeCategory);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgePoint | null>(null);
  const [selected, setSelected] = useState<KnowledgePoint | null>(null);

  async function remove(id: string) {
    if (!confirm("Remover este Ponto de Conhecimento?")) return;
    await Kp.deleteKnowledgePoint(supabase, id);
    setSelected(null);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl text-navy"><Compass className="h-5 w-5 text-gold" />Exploração do Conhecimento Bíblico</h2>
          <p className="text-sm text-muted-foreground">Lugares, personagens, linha do tempo, arqueologia e história — os Pontos de Conhecimento que enriquecem os estudos.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1.5"><Plus className="h-4 w-4" />Novo</Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.key} onClick={() => { setActiveCategory(c.key); setSelected(null); }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeCategory === c.key ? "border-gold bg-gold/10 text-navy" : "border-border text-muted-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />{c.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs italic text-muted-foreground">{CATEGORIES.find((c) => c.key === activeCategory)?.question}</p>

      {selected ? (
        <PointDetailAdmin point={selected} onBack={() => setSelected(null)} onEdit={() => { setEditing(selected); setShowForm(true); }} onDelete={() => remove(selected.id)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="text-left">
              <Card className="h-full transition hover:shadow-md">
                <CardContent className="pt-4">
                  {p.image_url && <img src={p.image_url} alt="" className="mb-2 h-24 w-full rounded-md object-cover" />}
                  <p className="font-semibold text-navy">{p.title}</p>
                  {p.subtitle && <p className="text-xs text-gold">{p.subtitle}</p>}
                  {p.period_label && <p className="text-[11px] text-muted-foreground">{p.period_label}</p>}
                </CardContent>
              </Card>
            </button>
          ))}
          {points.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum ponto de conhecimento cadastrado nessa categoria ainda.</p>}
        </div>
      )}

      {showForm && (
        <KnowledgePointForm
          editing={editing} defaultCategory={activeCategory}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); setSelected(null); }}
        />
      )}
    </div>
  );
}

function PointDetailAdmin({ point, onBack, onEdit, onDelete }: { point: KnowledgePoint; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  const qc = useQueryClient();
  const { data: detail } = useKnowledgePointDetail(point.id);
  const { data: allPoints = [] } = useKnowledgePoints();
  const [linkId, setLinkId] = useState("");
  const [relationType, setRelationType] = useState<RelationType | "">("");

  async function addRelation() {
    if (!linkId) return;
    await Kp.relateKnowledgePoints(supabase, point.id, linkId, relationType || undefined);
    setLinkId(""); setRelationType("");
    qc.invalidateQueries({ queryKey: ["knowledge-point-detail", point.id] });
  }
  async function removeRelation(otherId: string) {
    await Kp.unrelateKnowledgePoints(supabase, point.id, otherId);
    qc.invalidateQueries({ queryKey: ["knowledge-point-detail", point.id] });
  }

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-navy">← Voltar</button>
      <Card>
        <CardContent className="space-y-3 pt-4">
          {point.image_url && <img src={point.image_url} alt="" className="h-40 w-full rounded-lg object-cover" />}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg text-navy">{point.title}</h3>
              {point.subtitle && <p className="text-sm text-gold">{point.subtitle}</p>}
              {point.period_label && <p className="text-xs text-muted-foreground">{point.period_label}</p>}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          {point.description && <p className="text-sm text-ink">{point.description}</p>}
          {point.bible_refs && <p className="rounded-md bg-gold/10 px-2 py-1 text-xs font-semibold text-navy">📖 {point.bible_refs}</p>}

          <div className="border-t pt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Link2 className="h-3.5 w-3.5" />Relacionados</p>
            <div className="flex flex-wrap gap-1.5">
              {(detail?.related ?? []).map((r) => (
                <span key={r.related_id} className="flex items-center gap-1 rounded-full border bg-card px-2 py-1 text-xs">
                  {r.relation_type && r.relation_direction && (
                    <span className="font-semibold text-gold">{RELATION_LABELS[r.relation_type][r.relation_direction]}</span>
                  )}
                  {r.related_title}
                  <button onClick={() => removeRelation(r.related_id)}><X className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                </span>
              ))}
              {(detail?.related ?? []).length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum relacionamento ainda.</p>}
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <select value={linkId} onChange={(e) => setLinkId(e.target.value)} className="h-8 flex-1 rounded-md border bg-background px-2 text-xs">
                <option value="">Relacionar com…</option>
                {allPoints.filter((p) => p.id !== point.id).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <select value={relationType} onChange={(e) => setRelationType(e.target.value as RelationType | "")} className="h-8 flex-1 rounded-md border bg-background px-2 text-xs">
                <option value="">Tipo (opcional)</option>
                <option value="pai_de">Pai de</option>
                <option value="mae_de">Mãe de</option>
                <option value="conjuge_de">Cônjuge de</option>
                <option value="contemporaneo_de">Contemporâneo de</option>
                <option value="local_de">Local de</option>
              </select>
              <Button size="sm" onClick={addRelation} disabled={!linkId}>Vincular</Button>
            </div>
          </div>

          <VerseLinkSection knowledgePointId={point.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function KnowledgePointForm({ editing, defaultCategory, onClose, onDone }: {
  editing: KnowledgePoint | null; defaultCategory: KnowledgeCategory; onClose: () => void; onDone: () => void;
}) {
  const [category, setCategory] = useState<KnowledgeCategory>(editing?.category ?? defaultCategory);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [subtitle, setSubtitle] = useState(editing?.subtitle ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [imageUrl, setImageUrl] = useState(editing?.image_url ?? "");
  const [periodLabel, setPeriodLabel] = useState(editing?.period_label ?? "");
  const [bibleRefs, setBibleRefs] = useState(editing?.bible_refs ?? "");
  const [latitude, setLatitude] = useState(editing?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(editing?.longitude?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const payload = {
        category, title, subtitle: subtitle || undefined, description: description || undefined,
        image_url: imageUrl || undefined, period_label: periodLabel || undefined, bible_refs: bibleRefs || undefined,
        latitude: latitude ? Number(latitude) : undefined, longitude: longitude ? Number(longitude) : undefined,
      };
      if (editing) await Kp.updateKnowledgePoint(supabase, editing.id, payload);
      else await Kp.createKnowledgePoint(supabase, payload);
      onDone();
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy">{editing ? "Editar" : "Novo"} Ponto de Conhecimento</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value as KnowledgeCategory)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ex: Belém, Rei Davi, Êxodo…)" />
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtítulo (ex: Rei de Israel, Cidade da Judeia…)" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={3} />
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Imagem (URL)" />
        <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="Período/data (ex: Séc. X a.C.)" />
        <Input value={bibleRefs} onChange={(e) => setBibleRefs(e.target.value)} placeholder="Referências bíblicas (ex: 1 Samuel 17)" />
        {category === "lugar" && (
          <div className="grid grid-cols-2 gap-2">
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" />
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" />
          </div>
        )}
        <Button onClick={save} disabled={busy || !title.trim()} className="w-full">{busy ? "Salvando…" : "Salvar"}</Button>
      </CardContent>
    </Card>
  );
}

/** Vincula esse Ponto de Conhecimento a um versículo específico — ponte com a Bíblia Integrada (Fase 3). */
function VerseLinkSection({ knowledgePointId }: { knowledgePointId: string }) {
  const { data: me } = useMyProfile();
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function link() {
    setErr(""); setDone(false);
    const parsed = Bible.parseBibleReference(ref);
    if (!parsed || parsed.verseStart === undefined) { setErr("Use o formato \"João 3:16\" (com o versículo)."); return; }
    setBusy(true);
    try {
      await Bible.linkKnowledgePointToVerse(supabase, {
        book_abbrev: parsed.bookAbbrev, chapter: parsed.chapter,
        verse_start: parsed.verseStart, verse_end: parsed.verseEnd ?? parsed.verseStart,
        knowledge_point_id: knowledgePointId, created_by: me?.id,
      });
      setRef(""); setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao vincular — talvez já exista esse vínculo.");
    } finally { setBusy(false); }
  }

  return (
    <div className="border-t pt-3">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Vincular a um versículo (Bíblia Integrada)</p>
      <div className="flex gap-2">
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex: 1 Samuel 17:4" className="h-8 text-xs" />
        <Button size="sm" onClick={link} disabled={busy || !ref}>Vincular</Button>
      </div>
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
      {done && <p className="mt-1 text-xs text-green-700">Vinculado! Vai aparecer na leitura desse versículo.</p>}
    </div>
  );
}
