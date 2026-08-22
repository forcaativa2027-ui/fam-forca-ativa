"use client";

import { useEffect, useState } from "react";
import { MessageCircle, User, AlertTriangle, CheckCircle2, Clock, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

const sb = supabase as any;

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
  read_at?: string | null;
}

export default function AtendenteDashboard() {
  const [myConversations, setMyConversations] = useState<FamConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<FamConversation | null>(null);
  const [messages, setMessages] = useState<FamMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendantId, setAttendantId] = useState<string | null>(null);
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadAttendant();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!attendantId) return;
    loadConversations();
    const sub = sb.channel('atendente_new_conv')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fam_conversations' }, () => loadConversations())
      .subscribe();
    return () => sub.unsubscribe();
  }, [attendantId]);

  async function loadAttendant() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('fam_attendants').select('id').eq('profile_id', user.id).maybeSingle();
    if (data) setAttendantId(data.id);
  }

  async function loadConversations() {
    if (!attendantId) return;
    setLoading(true);
    try {
      const { data } = await sb.from('fam_conversations')
        .select('*')
        .eq('assigned_attendant_id', attendantId)
        .in('status', ['waiting', 'in_progress', 'paused_safe_contact'])
        .order('created_at', { ascending: false });
      setMyConversations(data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    let mounted = true;
    async function load() {
      const { data } = await sb.from('fam_messages')
        .select('*').eq('conversation_id', selectedConv.id).order('created_at', { ascending: true });
      if (mounted) setMessages(data ?? []);
      await sb.from('fam_messages').update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConv.id).is('read_at', null).neq('sender_attendant_id', attendantId);
    }
    const sub = sb.channel(`atendente_msg:${selectedConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fam_messages', filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as FamMessage]);
          if (notifyPermission === 'granted' && payload.new.sender_user_id) {
            new Notification('Nova mensagem FAM', { body: payload.new.body.slice(0, 100), icon: '/favicon.ico' });
          }
        })
      .subscribe();
    load();
    return () => { mounted = false; sub.unsubscribe(); };
  }, [selectedConv, attendantId]);

  async function requestNotificationPermission() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifyPermission(perm);
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selectedConv || !attendantId) return;
    try {
      await sb.from('fam_messages').insert({
        conversation_id: selectedConv.id,
        sender_attendant_id: attendantId,
        body: reply.trim(),
        delivered_at: new Date().toISOString(),
      });
      await sb.from('fam_conversations').update({ status: 'in_progress' }).eq('id', selectedConv.id);
      setReply("");
    } catch (e) { console.error(e); alert("Erro ao enviar"); }
  };

  const handlePause = async () => {
    if (!selectedConv) return;
    await sb.from('fam_conversations').update({ status: 'paused_safe_contact' }).eq('id', selectedConv.id);
    loadConversations();
  };

  const handleClose = async () => {
    if (!selectedConv) return;
    await sb.from('fam_conversations').update({ status: 'closed' }).eq('id', selectedConv.id);
    setSelectedConv(null);
    loadConversations();
  };

  const getStatusLabel = (s: string) => ({ waiting: 'Nova', in_progress: 'Em andamento', paused_safe_contact: 'Pausada (segurança)', closed: 'Encerrada', escalated: 'Escalada' }[s] || s);
  const getStatusColor = (s: string) => ({ waiting: 'bg-fam-danger/10 text-fam-danger', in_progress: 'bg-fam-magenta/10 text-fam-magenta', paused_safe_contact: 'bg-amber-100 text-amber-800', closed: 'bg-gray-100 text-gray-600', escalated: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold">FAM · Atendente</p>
          <h1 className="font-display text-3xl text-fam-plum">Painel de Atendimento</h1>
        </div>
        <div className="flex gap-2">
          <Bell className="h-5 w-5 text-fam-muted" />
          <span className="text-sm text-fam-muted">{notifyPermission === 'granted' ? 'Notificações ativas' : 'Notificações off'}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Minhas Conversas */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-lg">Minhas conversas ({myConversations.filter(c => c.status !== 'closed').length})</CardTitle>
            <Shield className="h-5 w-5 text-fam-magenta" />
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-4 text-center text-fam-muted">Carregando...</div> :
            myConversations.length === 0 ? <div className="p-4 text-center text-fam-muted">Nenhuma conversa atribuída</div> : (
              <div className="max-h-[700px] overflow-y-auto">
                {myConversations.filter(c => c.status !== 'closed').map(conv => (
                  <button key={conv.id} onClick={() => setSelectedConv(conv)}
                    className={`w-full p-4 border-b text-left hover:bg-fam-soft-pink transition ${selectedConv?.id === conv.id ? 'bg-fam-magenta/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-fam-deep-plum">
                          <MessageCircle className="h-4 w-4" />
                          {conv.contact_name || `Ref: ${conv.public_reference}`}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-fam-muted">
                          <span className={`px-2 py-0.5 rounded-full ${getStatusColor(conv.status)}`}>{getStatusLabel(conv.status)}</span>
                          <Clock className="h-3 w-3" />
                          <span>{new Date(conv.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          {selectedConv ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedConv.contact_name || `Conversa ${selectedConv.public_reference}`}</CardTitle>
                    <p className="text-sm text-fam-muted mt-1">
                      Status: <span className={`font-medium ${getStatusColor(selectedConv.status)} px-2 py-0.5 rounded`}>{getStatusLabel(selectedConv.status)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedConv.status !== 'closed' && selectedConv.status !== 'paused_safe_contact' && (
                      <Button variant="outline" onClick={handlePause} size="sm" className="gap-1">
                        <Shield className="h-3.5 w-3.5" /> Pausar (segurança)
                      </Button>
                    )}
                    {selectedConv.status === 'paused_safe_contact' && (
                      <Button variant="outline" onClick={() => sb.from('fam_conversations').update({status:'in_progress'}).eq('id',selectedConv.id).then(loadConversations)} size="sm">
                        Retomar
                      </Button>
                    )}
                    {selectedConv.status !== 'closed' && (
                      <Button variant="outline" onClick={handleClose} size="sm">Encerrar</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[700px]">
                <div className="flex-1 overflow-y-auto space-y-3 p-4 border rounded-lg bg-background">
                  {messages.length === 0 ? <p className="text-center text-fam-muted py-8">Nenhuma mensagem</p> : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_user_id ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender_user_id ? 'bg-fam-soft-pink text-fam-deep-plum' : 'bg-fam-magenta text-white'}`}>
                          {msg.body}
                          <div className="mt-1 text-[10px] opacity-70 text-right">{new Date(msg.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedConv.status !== 'closed' && (
                  <div className="mt-4 flex gap-2">
                    <Textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Sua resposta..." className="flex-1 min-h-[60px]" rows={2} />
                    <Button onClick={handleReply} disabled={!reply.trim()} className="self-end gap-2"><MessageCircle className="h-4 w-4" /> Enviar</Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-[700px] items-center justify-center">
              <div className="text-center text-fam-muted">
                <MessageCircle className="mx-auto h-12 w-12 opacity-30 mb-4" />
                <p className="font-display text-xl">Selecione uma conversa</p>
                <p className="mt-2 text-sm">Clique na lista para começar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function getStatusLabel(s: string) { return ({ waiting: 'Nova', in_progress: 'Em andamento', paused_safe_contact: 'Pausada (segurança)', closed: 'Encerrada', escalated: 'Escalada' }[s] || s); }
function getStatusColor(s: string) { return ({ waiting: 'bg-fam-danger/10 text-fam-danger', in_progress: 'bg-fam-magenta/10 text-fam-magenta', paused_safe_contact: 'bg-amber-100 text-amber-800', closed: 'bg-gray-100 text-gray-600', escalated: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-600'); }
