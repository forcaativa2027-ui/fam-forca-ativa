import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { AccessibilityProvider } from "@/components/shared/AccessibilityProvider";
import { RadioPlayerProvider } from "@/components/radio/RadioPlayerContext";
import { AccessibilityButton } from "@/components/shared/AccessibilityButton";
import { AccessibilityOnboarding } from "@/components/shared/AccessibilityOnboarding";
import { GlobalPublicBottomNavigation } from "@/components/shared/GlobalPublicBottomNavigation";
import { NavigationPreferencesPrompt } from "@/components/shared/NavigationPreferencesPrompt";

export const metadata: Metadata = {
  title: "FAM — Força Ativa da Mulher",
  description: "Plataforma de acolhimento, informação e proteção da Força Ativa da Mulher",
  manifest: "/manifest.json",
};

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").then(function (registration) { registration.update(); }).catch(function () {}); var refreshing = false; navigator.serviceWorker.addEventListener("controllerchange", function () { if (!refreshing) { refreshing = true; window.location.reload(); } }); }); }`,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <RadioPlayerProvider>
            <AccessibilityProvider>
              {children}
              <GlobalPublicBottomNavigation />
              <NavigationPreferencesPrompt />
              <ServiceWorkerRegistration />
              <AccessibilityButton />
              <AccessibilityOnboarding />
            </AccessibilityProvider>
          </RadioPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
