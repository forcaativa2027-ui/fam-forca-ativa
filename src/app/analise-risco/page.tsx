import { FamRiskAnalysisPage } from "@/components/public/FamSupportCenter";
import { BackButton } from "@/components/shared/BackButton";

export default function AnaliseRiscoPage() {
  return (
    <main className="container min-h-screen py-4">
      <BackButton fallbackHref="/painel" />
      <FamRiskAnalysisPage />
    </main>
  );
}
