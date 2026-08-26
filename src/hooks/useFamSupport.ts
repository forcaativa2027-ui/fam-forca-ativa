"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  createConversation,
  getConversation,
  listUserConversations,
  createMessage,
  listMessages,
  subscribeToMessages,
  getAvailableAttendants,
  assignAttendant,
} from "@/services/famSupport";
import type { FamConversation, FamMessage, FamAttendant } from "@/services/famSupport";
import {
  createRiskCase,
  saveRiskAnswers,
  updateRiskCaseAssessment,
  getRiskCase,
  getRiskAnswers,
} from "@/services/famRisk";
import type { FamRiskCase, FamRiskAnswer } from "@/services/famRisk";
import { createFamReferralRequest } from "@/services/famReferralRequests";
import type { FamReferralOption } from "@/services/famReferrals";
import {
  uploadAttachment,
  getAttachmentUrl,
  listCaseAttachments,
} from "@/services/famAttachments";
import type { FamAttachment } from "@/services/famAttachments";

export function useFamConversations(userId?: string) {
  const [conversations, setConversations] = useState<FamConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) { setConversations([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await listUserConversations(supabase, userId);
      setConversations(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const channel = supabase
      .channel(`fam_user_conversations:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fam_conversations", filter: `user_id=eq.${userId}` },
        (payload) => {
          const incoming = payload.new as FamConversation;
          const previous = payload.old as Partial<FamConversation>;
          if (payload.eventType === "DELETE") {
            setConversations((current) => current.filter((conversation) => conversation.id !== previous.id));
            return;
          }
          setConversations((current) => {
            const exists = current.some((conversation) => conversation.id === incoming.id);
            return exists
              ? current.map((conversation) => conversation.id === incoming.id ? { ...conversation, ...incoming } : conversation)
              : [incoming, ...current];
          });
        },
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [load, userId]);

  const startConversation = async (data: { user_id: string; community_id?: string; contact_name?: string }) => {
    const conv = await createConversation(supabase, data);
    setConversations((prev) => [conv, ...prev.filter((conversation) => conversation.id !== conv.id)]);
    return conv;
  };

  return { conversations, loading, error, startConversation, refetch: load };
}

export function useFamMessages(conversationId?: string) {
  const [messages, setMessages] = useState<FamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    let mounted = true;

    async function load() {
      if (!conversationId) { setMessages([]); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await listMessages(supabase, conversationId);
        if (mounted) setMessages(data);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : "Erro ao carregar mensagens");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const subscription = subscribeToMessages(supabase, conversationId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    load();

    return () => {
      mounted = false;
      subscription.then((sub) => sub.unsubscribe());
    };
  }, [conversationId]);

  const sendMessage = async (body: string, senderUserId: string) => {
    if (!conversationId) throw new Error("Sem conversa");
    const msg = await createMessage(supabase, {
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body,
    });
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  return { messages, loading, error, sendMessage };
}

export function useFamAttendants() {
  const [attendants, setAttendants] = useState<FamAttendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAvailableAttendants(supabase);
        setAttendants(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar atendentes");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const assign = async (conversationId: string, attendantId: string) => {
    await assignAttendant(supabase, conversationId, attendantId);
  };

  return { attendants, loading, error, assign };
}

// ===== Risk Analysis =====

export function useFamRiskCase(userId?: string) {
  const [riskCase, setRiskCase] = useState<FamRiskCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: { user_id: string; community_id?: string; contact_name?: string }) => {
    setLoading(true);
    try {
      const rc = await createRiskCase(supabase, data);
      setRiskCase(rc);
      return rc;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar caso");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const saveAnswers = async (caseId: string, answers: Record<string, string>) => {
    await saveRiskAnswers(supabase, caseId, answers);
  };

  const requestReferral = async (caseId: string, userId: string, option: FamReferralOption, confirmationAccepted: boolean, selectedAttachmentIds: string[] = []) => {
    setLoading(true);
    try {
      return await createFamReferralRequest(supabase, { caseId, userId, option, confirmationAccepted, selectedAttachmentIds });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao registrar encaminhamento");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async (
    caseId: string,
    assessment: {
      attention: FamRiskCase["attention"];
      preliminary_summary: string;
      limitations_acknowledged_at: string;
      current_step?: string;
      special_flow_flags?: string[];
      triggered_indicators?: string[];
      assessment_state?: string;
      transition_reason_code?: string;
      transition_rule_code?: string;
      referred_conversation_id?: string;
    }
  ) => {
    setLoading(true);
    try {
      const updated = await updateRiskCaseAssessment(supabase, caseId, assessment);
      setRiskCase(updated);
      return updated;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar avaliação");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { riskCase, loading, error, create, saveAnswers, submitAssessment, requestReferral };
}

// ===== Attachments =====

export function useFamAttachments() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, userId: string, caseId?: string, conversationId?: string) => {
    setUploading(true);
    try {
      const att = await uploadAttachment(supabase, { file, userId, caseId, conversationId });
      return att;
    } finally {
      setUploading(false);
    }
  };

  const getUrl = async (storagePath: string) => {
    return getAttachmentUrl(supabase, storagePath);
  };

  const listForCase = async (caseId: string) => {
    return listCaseAttachments(supabase, caseId);
  };

  return { upload, getUrl, listForCase, uploading };
}
