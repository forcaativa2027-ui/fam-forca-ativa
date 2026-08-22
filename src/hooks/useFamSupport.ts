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
