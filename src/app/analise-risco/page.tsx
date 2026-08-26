import Link from "next/link";
import { Phone, ShieldAlert } from "lucide-react";
import { FamRiskAnalysisPage } from "@/components/public/FamSupportCenter";
import { BackButton } from "@/components/shared/BackButton";
import { Button } from "@/components/ui/button";

export default function AnaliseRiscoPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b-[3px] border-gold bg-navy text-white shadow-sm">
        <div className="container flex min-h-16 items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="Voltar para a página inicial da FAM">
              <img src="/brand/fam-logo.jpg" alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
              <span className="truncate font-display text-sm font-bold sm:text-base">FAM · Força Ativa da Mulher</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" variant="outline" className="hidden border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:inline-flex">
              <a href="tel:180"><Phone className="mr-1.5 h-3.5 w-3.5" />180</a>
            </Button>
            <Button asChild size="sm" className="bg-fam-danger text-white hover:bg-fam-danger/90">
              <a href="tel:190"><ShieldAlert className="mr-1.5 h-3.5 w-3.5" />190</a>
            </Button>
          </div>
        </div>
      </header>
      <div className="container pt-3">
        <BackButton fallbackHref="/painel" />
      </div>
      <div className="container py-4">
        <FamRiskAnalysisPage />
      </div>
    </main>
  );
}
