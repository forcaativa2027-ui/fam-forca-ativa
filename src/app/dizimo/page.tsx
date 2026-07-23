"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, HandCoins, Landmark, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveCommunity } from "@/hooks/use-queries";

const PIX_TYPE_LABELS: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail", telefone: "Telefone", aleatoria: "Chave aleatória",
};

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] p-4">
      <div className="mx-auto max-w-lg py-8">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mb-6 text-center">
          <HandCoins className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Dízimo e Ofertas</h1>
          <p className="mt-2 text-sm text-white/70">
            "Trazei todos os dízimos à casa do tesouro... e provai-me nisto, diz o Senhor dos Exércitos,
            se eu não vos abrir as janelas do céu." — Malaquias 3:10
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="space-y-5 p-6">
            {community?.pix_key ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold">
                  <Sparkles className="h-3.5 w-3.5" />PIX — {community.pix_key_type ? PIX_TYPE_LABELS[community.pix_key_type] : "Chave"}
                </p>
                <div className="flex items-center gap-2 rounded-xl border-2 border-gold/30 bg-gold/5 p-4">
                  <span className="flex-1 truncate font-mono text-base font-bold text-navy">{community.pix_key}</span>
                  <Button size="sm" variant={copied ? "default" : "outline"} onClick={copyPix} className="shrink-0 gap-1.5">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Abra o app do seu banco, escolha PIX, cole a chave acima e confirme o valor da sua oferta ou dízimo.
                </p>
              </div>
            ) : (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                A chave PIX desta comunidade ainda não foi cadastrada. Fale com a secretaria da sua igreja para saber como contribuir.
              </p>
            )}

            {community?.bank_info && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-navy-600">
                  <Landmark className="h-3.5 w-3.5" />Transferência bancária (TED/DOC)
                </p>
                <pre className="whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 font-sans text-sm text-ink">{community.bank_info}</pre>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Pagamento online por cartão de crédito/débito estará disponível em breve, assim que a comunidade escolher um provedor de pagamentos.
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-white/50">
          {community?.name ?? "CEC Family"} agradece sua generosidade e fidelidade.
        </p>
      </div>
    </main>
  );
}
