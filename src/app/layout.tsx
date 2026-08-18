import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { AccessibilityProvider } from "@/components/shared/AccessibilityProvider";
import { RadioPlayerProvider } from "@/components/radio/RadioPlayerContext";
import { AccessibilityButton } from "@/components/shared/AccessibilityButton";
import { AccessibilityOnboarding } from "@/components/shared/AccessibilityOnboarding";

export const metadata: Metadata = {
  title: "CEC Family",
  description: "Plataforma apostólica da CEC Manaus — discipulado, células e gestão pastoral",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <RadioPlayerProvider>
            <AccessibilityProvider>
              {children}
              <AccessibilityButton />
              <AccessibilityOnboarding />
            </AccessibilityProvider>
          </RadioPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
