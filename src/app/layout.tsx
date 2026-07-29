import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { AccessibilityProvider } from "@/components/shared/AccessibilityProvider";
import { AccessibilityButton } from "@/components/shared/AccessibilityButton";
import { AccessibilityOnboarding } from "@/components/shared/AccessibilityOnboarding";

export const metadata: Metadata = {
  title: "CEC Family",
  description: "Plataforma apostólica da CEC Manaus — discipulado, células e gestão pastoral",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <AccessibilityProvider>
            {children}
            <AccessibilityButton />
            <AccessibilityOnboarding />
          </AccessibilityProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
