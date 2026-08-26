"use client";

import { useEffect, useState } from "react";
import { MessageCircle, User, AlertTriangle, CheckCircle2, Clock, ChevronRight, Phone, Pause, Play, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { listFamReferralRequests, updateFamReferralRequestStatus } from "@/services/famReferralOperations";
import type { FamReferralRequest, FamReferralRequestStatus } from "@/services/famReferralRequests";
import type { FamAttachment } from "@/services/famAttachments";
import { QuickExit } from "@/components/public/FamSupportCenter";

interface FamConversation {
  id: string;
  public_reference: string;
  user_id: string | null;
  status: string;
  contact_name: string | null;
  assigned_attendant_id: string | null;
  created_at: string;
  updated_at?: string;
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

const PAUSE_REASONS = [
  { value: "SAFE_CONTACT_PAUSE", label: "Segurança: pausar contato" },
  { value: "USER_REQUESTED_PAUSE", label: "Solicitado pela usuária" },
  { value: "OPERATIONAL_PAUSE", label: "Pausa operacional" },
] as const;

const CLOSE_REASONS = [
  { value: "USER_REQUESTED_CLOSE", label: "Solicitado pela usuária" },
  { value: "RESOLVED", label: "Atendimento concluído" },
  { value: "REFERRED", label: "Encaminhamento realizado" },
  { value: "NO_FURTHER_CONTACT", label: "Sem continuidade de contato" },
] as const;

function getAdminAttachmentStatus(attachment?: FamAttachment): { label: string; className: string } {
  if (!attachment) return { label: "metadados não carregados", className: "text-fam-muted" };
  const expired = Boolean(attachment.retention_expires_at && Date.parse(attachment.retention_expires_at) <= Date.now());
  if (expired || attachment.deleted_at) return { label: "expirado/removido", className: "text-fam-muted" };
  if (attachment.malware_scan_status === "clean") return { label: "limpo", className: "text-fam-success" };
  if (attachment.malware_scan_status === "pending") return { label: "em quarentena", className: "text-fam-muted" };
  return { label: "bloqueado", className: "text-fam-danger" };
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
  const [referralRequests, setReferralRequests] = useState<FamReferralRequest[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [operatorReviewRequestId, setOperatorReviewRequestId] = useState<string | null>(null);
  const [operatorConfirmationNote, setOperatorConfirmationNote] = useState("");
  const [lastQueueUpdate, setLastQueueUpdate] = useState<Date | null>(null);
  const [pauseReason, setPauseReason] = useState<(typeof PAUSE_REASONS)[number]["value"]>("SAFE_CONTACT_PAUSE");
  const [closeReason, setCloseReason] = useState<(typeof CLOSE_REASONS)[number]["value"]>("USER_REQUESTED_CLOSE");
  const [integrityResults, setIntegrityResults] = useState<Record<string, { isValid: boolean; checkedAt: string }>>({});
  const [attachmentStatuses, setAttachmentStatuses] = useState<Record<string, FamAttachment>>({});

  useEffect(() => {
    loadAttendants();
    loadConversations();
    loadReferralRequests();
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

  useEffect(() => {
    const channel = sb
      .channel("admin_fam_referral_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fam_referral_requests" },
        (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: FamReferralRequest; old: Partial<FamReferralRequest> }) => {
          const incoming = payload.new as FamReferralRequest;
          if (payload.eventType === "DELETE") {
            setReferralRequests((current) => current.filter((request) => request.id !== payload.old.id));
            return;
          }
          setReferralRequests((current) => {
            const exists = current.some((request) => request.id === incoming.id);
            return exists
              ? current.map((request) => request.id === incoming.id ? { ...request, ...incoming } : request)
              : [incoming, ...current];
          });
        },
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  async function loadReferralRequests() {
    setReferralLoading(true);
    try {
      const data = await listFamReferralRequests(sb);
      setReferralRequests(data);
      const attachmentIds = [...new Set(data.flatMap((request) => request.selected_attachment_ids))];
      if (attachmentIds.length > 0) {
        const { data: attachmentsData, error: attachmentsError } = await sb
          .from("fam_risk_attachments")
          .select("*")
          .in("id", attachmentIds);
        if (attachmentsError) throw attachmentsError;
        setAttachmentStatuses(Object.fromEntries(((attachmentsData ?? []) as FamAttachment[]).map((attachment) => [attachment.id, attachment])));
      }
    } catch (e) {
      console.error("Erro ao carregar solicitações:", e);
    } finally {
      setReferralLoading(false);
    }
  }

  async function handleReferralStatus(requestId: string, nextStatus: FamReferralRequestStatus) {
    if (nextStatus === "sent") {
      setOperatorReviewRequestId(requestId);
      setOperatorConfirmationNote("");
      return;
    }
    try {
      const updated = await updateFamReferralRequestStatus(sb, requestId, nextStatus);
      setReferralRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
    } catch (e) {
      console.error("Erro ao atualizar solicitação:", e);
      alert("Não foi possível atualizar esta solicitação. Verifique se sua conta é de atendente ativa e se a transição é permitida.");
    }
  }

  async function verifyPackageIntegrity(requestId: string) {
    try {
      const { data, error } = await sb.rpc("fam_verify_referral_package", { p_request_id: requestId });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      setIntegrityResults((current) => ({
        ...current,
        [requestId]: { isValid: Boolean(result?.is_valid), checkedAt: result?.verified_at ?? new Date().toISOString() },
      }));
    } catch (e) {
      console.error("Erro ao verificar integridade:", e);
      alert("Não foi possível verificar a integridade do pacote congelado.");
    }
  }

  async function confirmOperatorSend() {
    if (!operatorReviewRequestId || !operatorConfirmationNote.trim()) return;
    try {
      const updated = await updateFamReferralRequestStatus(sb, operatorReviewRequestId, "sent", { confirmed: true, note: operatorConfirmationNote.trim() });
      setReferralRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
      setOperatorReviewRequestId(null);
      setOperatorConfirmationNote("");
    } catch (e) {
      console.error("Erro ao confirmar envio:", e);
      alert("Não foi possível confirmar o envio. Verifique a permissão da atendente e tente novamente.");
    }
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
      setLastQueueUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const channel = sb
      .channel("admin_fam_conversations_queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fam_conversations" },
        (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: FamConversation; old: Partial<FamConversation> }) => {
          const incoming = payload.new;
          if (payload.eventType === "DELETE") {
            setConversations((current) => current.filter((conversation) => conversation.id !== payload.old.id));
            setSelectedConv((current) => current?.id === payload.old.id ? null : current);
          } else {
            setConversations((current) => {
              const exists = current.some((conversation) => conversation.id === incoming.id);
              const next = exists
                ? current.map((conversation) => conversation.id === incoming.id ? { ...conversation, ...incoming } : conversation)
                : [incoming, ...current];
              return next.sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());
            });
            setSelectedConv((current) => current?.id === incoming.id ? { ...current, ...incoming } : current);
          }
          setLastQueueUpdate(new Date());
        },
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

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

  const recordConversationEvent = async (conversationId: string, eventType: string, reason: string) => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("Sessão da atendente não encontrada");
    const { error } = await sb.from("fam_audit_events").insert({
      actor_user_id: user.id,
      conversation_id: conversationId,
      event_type: eventType,
      metadata: { reason },
    });
    if (error) throw error;
  };

  const handlePause = async (conv: FamConversation) => {
    try {
      const { error } = await sb.from("fam_conversations").update({ status: "paused_safe_contact" }).eq("id", conv.id);
      if (error) throw error;
      await recordConversationEvent(conv.id, "CONVERSATION_PAUSED", pauseReason);
      setSelectedConv({ ...conv, status: "paused_safe_contact" });
      await loadConversations();
    } catch (e) {
      console.error(e);
      alert("Não foi possível pausar a conversa com segurança. Nenhuma justificativa sensível deve ser registrada no campo de motivo.");
    }
  };

  const handleResume = async (conv: FamConversation) => {
    try {
      const { error } = await sb.from("fam_conversations").update({ status: "in_progress" }).eq("id", conv.id);
      if (error) throw error;
      await recordConversationEvent(conv.id, "CONVERSATION_RESUMED", "SAFE_CONTACT_RESUMED");
      setSelectedConv({ ...conv, status: "in_progress" });
      await loadConversations();
    } catch (e) {
      console.error(e);
      alert("Não foi possível retomar a conversa.");
    }
  };

  const handleClose = async (conv: FamConversation) => {
    if (!window.confirm("Encerrar esta conversa? O histórico será preservado e novas mensagens serão bloqueadas.")) return;
    try {
      const { error } = await sb.from("fam_conversations").update({ status: "closed" }).eq("id", conv.id);
      if (error) throw error;
      await recordConversationEvent(conv.id, "CONVERSATION_CLOSED", closeReason);
      setSelectedConv({ ...conv, status: "closed" });
      setReply("");
      await loadConversations();
    } catch (e) {
      console.error(e);
      alert("Não foi possível encerrar a conversa. O histórico permanece preservado.");
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" asChild className="border-fam-danger/40 text-fam-danger">
            <a href="tel:190" aria-label="Ligar para emergência 190">
              <Phone className="mr-2 h-4 w-4" /> 190
            </a>
          </Button>
          <Button variant="outline" asChild className="border-fam-danger/40 text-fam-danger">
            <a href="tel:180" aria-label="Ligar para o Ligue 180">
              <Phone className="mr-2 h-4 w-4" /> 180
            </a>
          </Button>
          <QuickExit />
          <Button variant="outline" onClick={loadConversations}>
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Solicitações de encaminhamento ({referralRequests.length})</CardTitle>
            <p className="mt-1 text-xs text-fam-muted">A revisão não envia dados automaticamente. Cada transição é validada e auditada no servidor.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadReferralRequests} disabled={referralLoading}>Atualizar</Button>
        </CardHeader>
        <CardContent>
          {referralLoading ? (
            <p className="text-sm text-fam-muted">Carregando solicitações...</p>
          ) : referralRequests.length === 0 ? (
            <p className="text-sm text-fam-muted">Nenhuma solicitação disponível para revisão.</p>
          ) : (
            <div className="space-y-3">
              {referralRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-fam-gold/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-fam-deep-plum">{request.recipient} · {request.priority}</p>
                      <p className="text-fam-muted">{request.purpose}</p>
                      <p className="text-xs text-fam-muted">Solicitada em {new Date(request.created_at).toLocaleString("pt-BR")}</p>
                      <div className="rounded-md bg-fam-lavender/40 p-3 text-xs text-fam-deep-plum">
                        <p><b>Resumo para revisão:</b> destinatário {request.recipient}; finalidade: {request.purpose}; prioridade: {request.priority}.</p>
                        <p className="mt-1"><b>Escopo textual:</b> {request.requested_data.join(", ") || "nenhum dado textual informado"}.</p>
                        <p className="mt-1"><b>Anexos selecionados:</b> {request.selected_attachment_ids.length ? request.selected_attachment_ids.map((attachmentId) => {
                          const attachment = attachmentStatuses[attachmentId];
                          return <span key={attachmentId} className="mr-2 inline-block">{attachment?.original_name ?? attachmentId} <span className={getAdminAttachmentStatus(attachment).className}>({getAdminAttachmentStatus(attachment).label})</span></span>;
                        }) : "nenhum"}.</p>
                        {request.status === "sent" && request.sent_package_hash && <>
                          <p className="mt-1"><b>Pacote congelado:</b> {request.sent_at ? new Date(request.sent_at).toLocaleString("pt-BR") : "sim"} · hash {request.sent_package_hash}.</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
                            <Button size="sm" variant="outline" onClick={() => verifyPackageIntegrity(request.id)}>Verificar integridade</Button>
                            {integrityResults[request.id] && <span className={`text-xs ${integrityResults[request.id].isValid ? "text-fam-success" : "text-fam-danger"}`} role="status">
                              {integrityResults[request.id].isValid ? "Snapshot íntegro" : "Snapshot divergente"} · {new Date(integrityResults[request.id].checkedAt).toLocaleString("pt-BR")}
                            </span>}
                          </div>
                        </>}
                      </div>
                      <p className="text-xs text-fam-muted">O recebimento não garante atendimento, investigação ou adoção de providência pelo destinatário.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${getReferralStatusColor(request.status)}`}>{getReferralStatusLabel(request.status)}</span>
                      {request.status === "requested" && <Button size="sm" onClick={() => handleReferralStatus(request.id, "under_review")}>Iniciar revisão</Button>}
                      {request.status === "under_review" && <Button size="sm" onClick={() => handleReferralStatus(request.id, "sent")}>Revisar e enviar</Button>}
                      {request.status === "sent" && <Button size="sm" onClick={() => handleReferralStatus(request.id, "received")}>Confirmar recebimento</Button>}
                      {(request.status === "requested" || request.status === "under_review" || request.status === "sent") && <Button size="sm" variant="outline" onClick={() => handleReferralStatus(request.id, "cancelled")}>Cancelar</Button>}
                    </div>
                  </div>
                  {operatorReviewRequestId === request.id && (
                    <div className="mt-4 space-y-3 rounded-md border border-fam-danger/30 bg-fam-danger/5 p-3">
                      <p className="text-sm font-semibold text-fam-deep-plum">Confirmação da atendente antes do envio</p>
                      <p className="text-xs leading-relaxed text-fam-muted">Confirme que você revisou o destinatário, a finalidade, o escopo textual e os anexos selecionados. Esta ação registra sua identidade e justificativa; não garante recebimento ou atendimento pelo destinatário.</p>
                      <Label htmlFor={`operator-note-${request.id}`}>Justificativa operacional</Label>
                      <Textarea id={`operator-note-${request.id}`} value={operatorConfirmationNote} onChange={(event) => setOperatorConfirmationNote(event.target.value)} placeholder="Descreva a revisão realizada e o motivo do envio." rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!operatorConfirmationNote.trim()} onClick={confirmOperatorSend}>Confirmar e marcar como enviado</Button>
                        <Button size="sm" variant="outline" onClick={() => { setOperatorReviewRequestId(null); setOperatorConfirmationNote(""); }}>Voltar</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Lista de Conversas */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversas ({conversations.length})</CardTitle>
            <p className="mt-1 text-xs text-fam-muted" aria-live="polite">
              {lastQueueUpdate ? `Fila atualizada às ${lastQueueUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Sincronizando fila..."}
            </p>
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
                          <span>{new Date(conv.updated_at ?? conv.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
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
                        aria-label="Atendente responsável pela conversa"
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
                    {selectedConv.status === "paused_safe_contact" && (
                      <Button variant="outline" onClick={() => handleResume(selectedConv)} size="sm">
                        <Play className="mr-2 h-4 w-4" /> Retomar
                      </Button>
                    )}
                    {selectedConv.status !== "closed" && selectedConv.status !== "paused_safe_contact" && (
                      <>
                        <select aria-label="Motivo da pausa — não registre detalhes sensíveis" className="max-w-[190px] rounded border px-2 py-1 text-xs" value={pauseReason} onChange={(event) => setPauseReason(event.target.value as typeof pauseReason)}>
                          {PAUSE_REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                        </select>
                        <Button variant="outline" onClick={() => handlePause(selectedConv)} size="sm">
                          <Pause className="mr-2 h-4 w-4" /> Pausar
                        </Button>
                      </>
                    )}
                    {selectedConv.status !== "closed" && (
                      <>
                        <select aria-label="Motivo do encerramento — não registre detalhes sensíveis" className="max-w-[180px] rounded border px-2 py-1 text-xs" value={closeReason} onChange={(event) => setCloseReason(event.target.value as typeof closeReason)}>
                          {CLOSE_REASONS.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                        </select>
                        <Button variant="outline" onClick={() => handleClose(selectedConv)} size="sm">
                          <LockKeyhole className="mr-2 h-4 w-4" /> Encerrar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[600px]">
                {selectedConv.status === "paused_safe_contact" && (
                  <div className="mb-4 rounded-lg border border-fam-danger/30 bg-fam-danger/5 p-3 text-sm text-fam-deep-plum" role="status">
                    Conversa pausada por segurança. Não envie novas mensagens até que seja seguro retomar o contato.
                  </div>
                )}
                {selectedConv.status === "closed" && (
                  <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3 text-sm text-fam-muted" role="status">
                    Conversa encerrada. O histórico permanece preservado para rastreabilidade e novas mensagens estão bloqueadas.
                  </div>
                )}
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
                {selectedConv.status !== "closed" && selectedConv.status !== "paused_safe_contact" && (
                  <div className="mt-4 flex gap-2">
                    <label htmlFor="fam-attendant-reply" className="sr-only">Resposta para a usuária</label>
                    <Textarea
                      id="fam-attendant-reply"
                      aria-describedby="fam-attendant-reply-help"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Escreva uma resposta acolhedora e objetiva..."
                      className="flex-1 min-h-[60px]"
                      rows={2}
                    />
                    <span id="fam-attendant-reply-help" className="sr-only">Não inclua detalhes desnecessários ou informações que possam aumentar o risco.</span>
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

function getReferralStatusLabel(status: FamReferralRequestStatus) {
  const labels: Record<FamReferralRequestStatus, string> = {
    requested: "Solicitada",
    under_review: "Em revisão",
    sent: "Enviada",
    received: "Recebimento confirmado",
    cancelled: "Cancelada",
  };
  return labels[status];
}

function getReferralStatusColor(status: FamReferralRequestStatus) {
  const colors: Record<FamReferralRequestStatus, string> = {
    requested: "bg-amber-100 text-amber-800",
    under_review: "bg-blue-100 text-blue-800",
    sent: "bg-fam-magenta/10 text-fam-magenta",
    received: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return colors[status];
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
