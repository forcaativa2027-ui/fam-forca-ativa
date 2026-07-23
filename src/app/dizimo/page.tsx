"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, HandCoins, Landmark, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DarkBlueTheme } from "@/components/shared/DarkBlueTheme";
import { useActiveCommunity } from "@/hooks/use-queries";

// QR Code padrão (Águas Claras / Taguatinga Norte) — usado até cada igreja
// cadastrar o próprio QR Code em Admin → Organização → Comunidades.
const DEFAULT_QR_CODE = "/images/pix-qrcodes/aguas-claras-taguatinga-norte.jpg";

export default function DizimoPage() {
  const { data: community } = useActiveCommunity();
  const [copied, setCopied] = useState(false);

  function copyPix() {
    if (!community?.pix_key) return;
    navigator.clipboard.writeText(community.pix_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DarkBlueTheme className="p-4">
      <div className="mx-auto max-w-lg py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mb-6 text-center">
          <img src="/images/cec-family-logo.png" alt="CEC Family" className="mx-auto h-14 w-14 object-contain" />
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Dízimo e Ofertas</h1>
          <p className="mt-2 text-sm text-white/70">
            "Trazei todos os dízimos à casa do tesouro... e provai-me nisto, diz o Senhor dos Exércitos,
            se eu não vos abrir as janelas do céu." — Malaquias 3:10
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold">
                <Sparkles className="h-3.5 w-3.5" />Momento da Generosidade
              </p>
              <div className="mb-3 flex justify-center rounded-xl bg-white p-3">
                <img src={community?.qr_code_url || DEFAULT_QR_CODE} alt="QR Code PIX" className="h-56 w-56 object-contain" />
              </div>

              {community?.pix_key && (
                <div className="flex items-center gap-2 rounded-xl border-2 border-gold/30 bg-gold/10 p-4">
                  <span className="flex-1 truncate font-mono text-base font-bold text-white">{community.pix_key}</span>
                  <Button size="sm" variant={copied ? "default" : "outline"} onClick={copyPix} className="shrink-0 gap-1.5">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              )}
              <p className="mt-2 text-[11px] text-white/60">
                Abra o app do seu banco, escolha PIX e escaneie o QR Code acima{community?.pix_key ? " (ou cole a chave)" : ""} para confirmar o valor da sua oferta ou dízimo.
              </p>
            </div>

            {community?.bank_info && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold">
                  <Landmark className="h-3.5 w-3.5" />Transferência bancária (TED/DOC)
                </p>
                <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 font-sans text-sm text-white/90">{community.bank_info}</pre>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-blue-100">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Pagamento online por cartão de crédito/débito estará disponível em breve, assim que a comunidade escolher um provedor de pagamentos.
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-white/50">
          {community?.name ?? "CEC Family"} agradece sua generosidade e fidelidade.
        </p>
      </div>
    </DarkBlueTheme>
  );
}
