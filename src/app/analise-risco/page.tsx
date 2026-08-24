import { FamRiskAnalysisPage } from "@/components/public/FamSupportCenter";
import { Header } from "@/components/shared/Header";

export default function AnaliseRiscoPage() {
  return (
    <div className="min-h-screen bg-fam-ivory-pink">
      <Header title="Análise de Risco" showBackButton href="/" />
      <main className="container py-6">
        <FamRiskAnalysisPage />
      </main>
    </div>
  );
}
