"use client";
import Link from "next/link";
import { Users, Heart, MessageCircleHeart, Home as HomeIcon, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const CTAS = [
  { intent: "lifegroup",                label: "Quero ser voluntária",          description: "Participar de ações e projetos da FAM",          icon: Users,             accent: "from-fam-gold-soft/25 to-fam-gold-soft/5"   },
  { intent: "discipulado",              label: "Quero participar de projetos",  description: "Conhecer oportunidades de apoio e atuação social", icon: Heart,             accent: "from-fam-lilac/25 to-fam-lilac/5" },
  { intent: "acompanhamento_pastoral",  label: "Quero compartilhar minha experiência", description: "Apresentar conhecimentos e experiências sociais", icon: MessageCircleHeart, accent: "from-fam-coral/20 to-fam-coral/5" },
  { intent: "visita",                   label: "Quero receber um contato",      description: "Solicitar retorno da equipe FAM", icon: HomeIcon,          accent: "from-fam-soft-pink to-white" },
] as const;

export function PublicParticipateSection() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-navy">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl">Quero participar</h2>
        </div>
        <p className="mt-2 text-sm text-muted max-w-xl">
          Encontre uma forma de se aproximar da FAM, participar de projetos ou compartilhar sua experiência.
          Escolha a opção que melhor descreve o que você procura agora.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CTAS.map((cta) => {
          const Ico = cta.icon;
          return (
            <Link key={cta.intent} href={`/cadastrar?intent=${cta.intent}`} className="group">
              <Card className={`h-full transition-all hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br ${cta.accent}`}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="rounded-xl bg-navy p-3 text-gold">
                    <Ico className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <b className="block text-navy">{cta.label}</b>
                    <p className="mt-1 text-xs text-muted">{cta.description}</p>
                    <p className="mt-3 flex items-center gap-1 text-xs font-bold text-gold opacity-0 transition group-hover:opacity-100">
                      Começar agora <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        Já tem cadastro? <Link href="/entrar" className="font-bold text-gold hover:underline">Acesse sua área privada</Link>.
      </p>
    </div>
  );
}
