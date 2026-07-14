"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IdCard, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemberCard } from "@/hooks/use-queries";
import { CARD_STATUS_LABELS, CARD_STATUS_COLORS, qrCodeImageUrl, issueMemberCard } from "@/services/cecId";
import { supabase } from "@/lib/supabase/client";
import type { Member } from "@/types/domain";

/**
 * CEC ID — Carteirinha Digital (Fase 1). Mostra foto, nome, CEC ID,
 * categoria institucional, igreja e QR Code — ou, se ainda não elegível,
 * o status de preparação (Aguardando foto/documentos/aprovação, etc.).
 */
export function MyCredentialCard({ member, churchName }: { member: Member | null | undefined; churchName?: string | null }) {
  const qc = useQueryClient();
  const { data: card } = useMemberCard(member?.id ?? null);

  useEffect(() => {
    if (card?.card_status === "elegivel" && member?.id) {
      issueMemberCard(supabase, member.id).then(() => {
        qc.invalidateQueries({ queryKey: ["member-card", member.id] });
      }).catch(() => {});
    }
  }, [card?.card_status, member?.id, qc]);

  if (!member || !card) return null;

  const isReady = card.card_status === "elegivel" || card.card_status === "emitida";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {isReady ? (
          <div className="bg-[radial-gradient(circle_at_20%_20%,#16345A,#0E2A47_70%)] p-5 text-white">
            <div className="flex items-center gap-2 text-gold">
              <IdCard className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Carteirinha Digital · CEC Family</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold bg-white/10">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl font-bold text-white/60">
                    {member.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-tight">{member.full_name}</p>
                <p className="text-xs text-gold">{card.categoria}</p>
                {churchName && <p className="text-[11px] text-white/70">{churchName}</p>}
                <p className="mt-1 font-mono text-[11px] text-white/80">{card.cec_id}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-white/10 p-3">
              <div className="text-[11px] text-white/70">
                <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> Vínculo ativo</p>
                {card.card_status === "emitida" && <p className="mt-0.5">Emitida</p>}
              </div>
              <img src={qrCodeImageUrl(card.qr_token)} alt="QR Code da carteirinha" className="h-16 w-16 rounded bg-white p-1" />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2 text-navy">
              <IdCard className="h-4 w-4" />
              <p className="text-sm font-bold">Carteirinha Digital CEC</p>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${CARD_STATUS_COLORS[card.card_status]}`}>
              <Clock className="h-3 w-3" /> {CARD_STATUS_LABELS[card.card_status]}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {card.card_status === "aguardando_aprovacao"
                ? "Seu cadastro está completo — aguardando aprovação da liderança pra emitir sua carteirinha."
                : "Complete seu cadastro acima pra liberar a sua Carteirinha Digital."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
