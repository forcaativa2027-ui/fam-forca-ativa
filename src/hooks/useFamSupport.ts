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
import {
  uploadAttachment,
  getAttachmentUrl,
  listCaseAttachments,
} from "@/services/famAttachments";
import type { FamAttachment } from "@/services/famAttachments";
import { createRiskEngine, RiskEngine } from "@/services/riskEngine";
import { createAssessmentStateMachine, AssessmentStateMachine } from "@/services/riskStateMachine";

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

  useEffect(() => { load(); }, [load]);

  const startConversation = async (data: { user_id: string; community_id?: string; contact_name?: string }) => {
    const conv = await createConversation(supabase, data);
    setConversations((prev) => [conv, ...prev]);
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

  const submitAssessment = async (
    caseId: string,
    assessment: {
      attention: 'immediate' | 'relevant' | 'specialized' | 'insufficient_information';
      preliminary_summary: string;
      limitations_acknowledged_at: string;
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

  return { riskCase, loading, error, create, saveAnswers, submitAssessment };
}

// ===== Risk Engine =====

export function useFamRiskEngine() {
  const [engine, setEngine] = useState<RiskEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { createRiskEngine } = await import("@/services/riskEngine");
        const { createClient } = await import("@/lib/supabase/client");
        const sb = createClient();
        const engine = createRiskEngine(sb);
        setEngine(engine);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao inicializar Risk Engine");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return { engine, loading, error };
}

// ===== State Machine =====

export function useFamStateMachine() {
  const [stateMachine, setStateMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { createAssessmentStateMachine } = await import("@/services/riskStateMachine");
        const { createClient } = await import("@/lib/supabase/client");
        const sb = createClient();
        const machine = createAssessmentStateMachine(sb);
        setStateMachine(machine);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao inicializar State Machine");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Return current state and transition function
  const state = stateMachine?.getState() || 'initial';
  const transition = stateMachine?.transition.bind(stateMachine);
  const canAnswer = stateMachine?.canAnswer?.() ?? false;
  const canAttach = stateMachine?.canAttach?.() ?? false;
  const isEmergency = stateMachine?.isEmergency?.() ?? false;
  const getAnswers = () => stateMachine?.getAnswers?.() || {};
  const getAnsweredCount = stateMachine?.getAnsweredCount?.() || 0;

  return { 
    state, 
    transition: stateMachine?.transition.bind(stateMachine),
    canAnswer,
    canAttach,
    isEmergency,
    getAnswers,
    getAnsweredCount,
    loading,
    error
  };
}

// ===== Attachments =====

export function useFamAttachments() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, userId: string, caseId?: string, conversationId?: string) => {
    setUploading(true);
    try {
      const { uploadAttachment } = await import("@/services/famAttachments");
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const att = await uploadAttachment(sb, { file, userId, caseId, conversationId });
      return att;
    } finally {
      setUploading(false);
    }
  };

  const getUrl = async (storagePath: string) => {
    const { getAttachmentUrl } = await import("@/services/famAttachments");
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    return getAttachmentUrl(sb, storagePath);
  };

  const listForCase = async (caseId: string) => {
    const { listCaseAttachments } = await import("@/services/famAttachments");
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    return listCaseAttachments(sb, caseId);
  };

  return { upload, getUrl, listForCase, uploading };
}
