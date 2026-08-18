"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Trash2, Pencil, X, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/shared/ToastProvider";
import { useAllRadioPrograms, useRadioProgram } from "@/hooks/use-queries";
import { createRadioProgram, updateRadioProgram, deleteRadioProgram } from "@/services/radio";
import { radioProgramSchema } from "@/schemas/radioProgramSchema";
import type { RadioProgram } from "@/types/domain";

const CATEGORIES = [
  { value: "pregacao", label: "Pregação" },
  { value: "louvor", label: "Louvor" },
  { value: "devocional", label: "Devocional" },
  { value: "noticia", label: "Notícia" },
  { value: "entrevista", label: "Entrevista" },
  { value: "estudo", label: "Estudo" },
  { value: "mensagem", label: "Mensagem" },
  { value: "especial", label: "Especial" },
  { value: "informacao", label: "Informação" },
];

export function RadioAdmin() {
  const { data: programs = [], isLoading } = useAllRadioPrograms();
  const { data: program = null } = useRadioProgram("1");
  const { toast } = useToast();
  const [editing, setEditing] = useState<RadioProgram | null>(null);
  const [err, setErr] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof radioProgramSchema>>({
    resolver: zodResolver(radioProgramSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "pregacao",
      start_time: "",
      end_time: "",
      is_live: false,
      presenter: "",
      audio_url: "",
      thumbnail_url: "",
      sort_order: 0,
    },
  });

  const title = watch("title");
  const category = watch("category");

  function startEdit(n: RadioProgram) {
    setEditing(n);
    setErr("");
    setFormOpen(true);
  }
  function cancelEdit() {
    setEditing(null);
    setFormOpen(false);
    reset({
      title: "",
      description: "",
      category: "pregacao",
      start_time: "",
      end_time: "",
      is_live: false,
      presenter: "",
      audio_url: "",
      thumbnail_url: "",
      sort_order: 0,
    });
  }

  async function onSubmit(v: z.infer<typeof radioProgramSchema>) {
    setErr("");
    try {
      if (editing) {
        await updateRadioProgram(editing.id, v);
        await toast("success", "Programa atualizado", "Os dados do programa foram salvos com sucesso.");
        // TODO: logAudit aqui se desejar
      } else {
        const next_order = programs.length > 0 ? Math.max(...programs.map((p) => p.sort_order)) + 1 : 0;
        const created = await createRadioProgram(programs[0]?.church_id ?? "", v);
        await toast("success", "Programa criado", `${created.title} foi adicionado à programação.`);
        // TODO: logAudit aqui se desejar
      }
      cancelEdit();
      // Invalidar queries para atualizar a lista
      // await queryClient.invalidateQueries({ queryKey: ["all-radio-programs"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      await toast("error", "Erro ao salvar", msg);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar Programa
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpenModal(!openModal)}>
          {openModal ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Tabela de Programas */}
      <Card className="rounded-xl border border-border p-6">
        <CardHeader>
          <CardTitle>Programação da Rádio Web</CardTitle>
          <CardDescription>Gerenciar programas e conteúdos de áudio</CardDescription>
        </CardHeader>
        <CardContent className="h-96 overflow-y-auto">
          {isLoading && <p className="text-center py-8">Carregando programas...</p>}
          {programs.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Nenhum programa cadastrado. <Button variant="outline" onClick={() => setFormOpen(true)}>
                Clique aqui para adicionar o primeiro programa
              </Button>
            </p>
          )}
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-border p-3 border-border cursor-pointer hover:bg-border transition-colors {editing?.id === p.id ? "bg-border" : ""}"
              onClick={() => startEdit(p)}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-navy truncate">{p.title}</p>
                {p.presenter && <p className="text-xs text-muted-foreground">por {p.presenter}</p>}
              </div>
              <div className="text-right text-xs">
                <span className={p.is_live ? "text-red-500 font-medium" : "text-muted-foreground"}>
                  {p.is_live ? "AO VIVO" : "Agendado"}
                </span>
                <br />
                <span className="text-[10px]">{p.start_time} - {p.end_time || "—"}</span>
              </div>
              <Button
                size="ghost"
                className="p-1 rounded"
                onClick={() => startEdit(p)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              {editing?.id !== p.id && (
                <Button
                  size="ghost"
                  className="p-1 rounded text-red-500"
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja excluir este programa?")) {
                      deleteRadioProgram(p.id);
                      await toast("success", "Excluído", "Programa removido da programação.");
                      // queryClient.invalidateQueries({ queryKey: ["all-radio-programs"] });
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal de Cadastro/Edição */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-zx flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90%] rounded-xl border-border p-6">
            <CardHeader>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-gold" />
                  <span className="font-medium text-gold"> Editar Programa</span>
                </div>
              ) : (
                <Plus className="h-4 w-4 text-gold" />
              )}</CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <Label>Título <span className="text-red-500">*</span></Label>
                    <Input
                      {...register("title", { required: "Título é obrigatório" })}
                      value={watch("title")}
                      placeholder="Ex: Segunda-Feira - Culto da Manhã"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria <span className="text-red-500">*</span></Label>
                      <Input
                        {...register("category", { required: "Categoria é obrigatória" })}
                        value={watch("category")}
                        asChild
                      >
                        {CATEGORIES.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            selected={watch("category") === opt.value}
                          >
                            {opt.label}
                          </option>
                        )}
                      </Input>
                    </div>
                    <div>
                      <Label>Horário Início <span className="text-red-500">*</span></Label>
                      <Input
                        {...register("start_time", { required: "Horário de início é obrigatório" })}
                        type="time"
                        value={watch("start_time")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Horário Fim</Label>
                      <Input
                        {...register("end_time")}
                        type="time"
                        value={watch("end_time")}
                      />
                    </div>
                    <div>
                      <Label>Apresentador</Label>
                      <Input
                        {...register("presenter")}
                        value={watch("presenter")}
                        placeholder="Ex: João Silva, Maria Costa"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Áudio (URL)</Label>
                    <Input
                      {...register("audio_url", { pattern: "^https?://.+" })}
                      type="url"
                      value={watch("audio_url")}
                      placeholder="https://exemplo.com/audio.mp3"
                    />
                  </div>
                  <div>
                    <Label>Miniatura (URL)</Label>
                    <Input
                      {...register("thumbnail_url", { pattern: "^https?://.+" })}
                      type="url"
                      value={watch("thumbnail_url")}
                      placeholder="https://exemplo.com/thumb.jpg"
                    />
                  </div>
                  <div>
                    <Label>Ordem de Exibição</Label>
                    <Input
                      {...register("sort_order", { valueAsNumber: true })}
                      type="number"
                      value={watch("sort_order")}
                    />
                  </div>
                  {editing && (
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" type="button" onClick={cancelEdit}>
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                      <Button type="submit">Salvar Alterações</Button>
                    </div>
                  )}
                  {!editing && (
                    <div className="mt-4 flex items-center justify-between">
                      <Button variant="outline" type="button" onClick={cancelEdit}>
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                      <Button type="submit">Criar Programa</Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
