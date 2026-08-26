"use client";

import { useEffect, useState } from "react";
import { MessageCircle, User, AlertTriangle, CheckCircle2, Clock, ChevronRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface FamConversation {
  id: string;
  public_reference: string;
  user_id: string | null;
  status: string;
  contact_name: string | null;
  assigned_attendant_id: string | null;
  created_at: string;
}

interface FamMessage {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_attendant_id: string | null;
  body: string;
  created_at: string;
}

interface FamAttendant {
  id: string;
  profile_id: string;
  role_label: string;
  status: string;
}

// Cast supabase to any para acessar tabelas não tipadas
const sb = supabase as any;

export default function FamAtendimentoAdmin() {
  const [conversations, setConversations] = useState<FamConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<FamConversation | null>(null);
  const [messages, setMessages] = useState<FamMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendants, setAttendants] = useState<FamAttendant[]>([]);
  const [currentAttendantId, setCurrentAttendantId] = useState<string | null>(null);

  useEffect(() => {
    loadAttendants();
    loadConversations();
  }, []);

  async function loadAttendants() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: attendant } = await sb
      .from("fam_attendants")
      .select("*")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (attendant) setCurrentAttendantId(attendant.id);

    const { data: attendantsData } = await sb
      .from("fam_attendants")
      .select("*")
      .eq("status", "active");
    setAttendants(attendantsData ?? []);
  }

  async function loadConversations() {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("fam_conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setConversations(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    const convId = selectedConv.id;
    let mounted = true;

    async function loadMessages() {
      const { data } = await sb
        .from("fam_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (mounted) setMessages(data ?? []);
    }

    const sub = sb
      .channel(`admin_messages:${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "fam_messages", filter: `conversation_id=eq.${convId}` },
        (payload: { new: FamMessage }) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    loadMessages();
    return () => { mounted = false; sub.unsubscribe(); };
  }, [selectedConv]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedConv || !currentAttendantId) return;
    try {
      await sb.from("fam_messages").insert({
        conversation_id: selectedConv.id,
        sender_attendant_id: currentAttendantId,
        body: reply.trim(),
        delivered_at: new Date().toISOString(),
      });
      setReply("");
      await sb.from("fam_conversations").update({ status: "in_progress" }).eq("id", selectedConv.id);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar resposta");
    }
  };

  const handleAssign = async (convId: string, attendantId: string | undefined) => {
    try {
      await sb.from("fam_conversations").update({ assigned_attendant_id: attendantId ?? null, status: "in_progress" }).eq("id", convId);
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async (convId: string) => {
    try {
      await sb.from("fam_conversations").update({ status: "closed" }).eq("id", convId);
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      waiting: "Aguardando",
      in_progress: "Em atendimento",
      paused_safe_contact: "Pausado (segurança)",
      referred: "Encaminhado",
      resolved: "Resolvido",
      closed: "Encerrado",
      escalated: "Escalado",
    };
    return labels[status] ?? status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: "bg-amber-100 text-amber-800",
      in_progress: "bg-fam-magenta/10 text-fam-magenta",
      paused_safe_contact: "bg-fam-danger/10 text-fam-danger",
      referred: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-600",
      escalated: "bg-red-100 text-red-800",
    };
    return colors[status] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold">FAM · Administração</p>
          <h1 className="font-display text-3xl text-fam-plum">Central de Atendimento</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConversations}>
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Lista de Conversas */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversas ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-fam-muted">Carregando...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-fam-muted">Nenhuma conversa</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-4 border-b text-left hover:bg-fam-soft-pink transition ${
                      selectedConv?.id === conv.id ? "bg-fam-magenta/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-fam-deep-plum">
                          <MessageCircle className="h-4 w-4" />
                          {conv.contact_name ? `${conv.contact_name}` : `Ref: ${conv.public_reference}`}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-fam-muted">
                          <span className={`px-2 py-0.5 rounded-full ${getStatusColor(conv.status)}`}>
                            {getStatusLabel(conv.status)}
                          </span>
                          <Clock className="h-3 w-3" />
                          <span>{new Date(conv.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </div>
                      {selectedConv?.id === conv.id && <ChevronRight className="h-4 w-4 text-fam-magenta" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Área Principal - Chat ou Seleção */}
        <Card>
          {selectedConv ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedConv.contact_name ? `Conversa com ${selectedConv.contact_name}` : `Conversa ${selectedConv.public_reference}`}
                    </CardTitle>
                    <p className="text-sm text-fam-muted mt-1">
                      Status: <span className={`font-medium ${getStatusColor(selectedConv.status)} px-2 py-0.5 rounded`}>{getStatusLabel(selectedConv.status)}</span>
                      {selectedConv.assigned_attendant_id && " · Atribuída"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedConv.status !== "closed" && (
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={selectedConv.assigned_attendant_id ?? ""}
                        onChange={(e) => handleAssign(selectedConv.id, e.target.value || undefined)}
                      >
                        <option value="">Atribuir atendente</option>
                        {attendants.map((a) => (
                          <option key={a.id} value={a.id}>{a.role_label}</option>
                        ))}
                      </select>
                    )}
                    {selectedConv.status !== "closed" && (
                      <Button variant="outline" onClick={() => handleClose(selectedConv.id)} size="sm">
                        Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[600px]">
                <div className="flex-1 overflow-y-auto space-y-3 p-4 border rounded-lg bg-background">
                  {messages.length === 0 ? (
                    <p className="text-center text-fam-muted py-8">Nenhuma mensagem ainda</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_user_id ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            msg.sender_user_id
                              ? "bg-fam-soft-pink text-fam-deep-plum"
                              : "bg-fam-magenta text-white"
                          }`}
                        >
                          {msg.body}
                          <div className="mt-1 text-[10px] opacity-70 text-right">
                            {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedConv.status !== "closed" && (
                  <div className="mt-4 flex gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1 min-h-[60px]"
                      rows={2}
                    />
                    <Button onClick={handleReply} disabled={!reply.trim()} className="self-end gap-2">
                      <MessageCircle className="h-4 w-4" /> Enviar
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-[600px] items-center justify-center">
              <div className="text-center text-fam-muted">
                <MessageCircle className="mx-auto h-12 w-12 opacity-30 mb-4" />
                <p className="font-display text-xl">Selecione uma conversa</p>
                <p className="mt-2 text-sm">Clique em uma conversa na lista para iniciar o atendimento</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting: "Aguardando",
    in_progress: "Em atendimento",
    paused_safe_contact: "Pausado (segurança)",
    referred: "Encaminhado",
    resolved: "Resolvido",
    closed: "Encerrado",
    escalated: "Escalado",
  };
  return labels[status] ?? status;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-800",
    in_progress: "bg-fam-magenta/10 text-fam-magenta",
    paused_safe_contact: "bg-fam-danger/10 text-fam-danger",
    referred: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-600",
    escalated: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}
