import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/layout/QueryProvider";
import { AccessibilityProvider } from "@/components/shared/AccessibilityProvider";
import { RadioPlayerProvider } from "@/components/radio/RadioPlayerContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AccessibilityButton } from "@/components/shared/AccessibilityButton";
import { AccessibilityOnboarding } from "@/components/shared/AccessibilityOnboarding";

export const metadata: Metadata = {
  title: "Servo360",
  description: "Plataforma configurável para igrejas, comunidades e organizações.",
  manifest: "/manifest.json",
};

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); }); }`,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <TenantProvider>
            <RadioPlayerProvider>
              <AccessibilityProvider>
                {children}
                <ServiceWorkerRegistration />
                <AccessibilityButton />
                <AccessibilityOnboarding />
              </AccessibilityProvider>
            </RadioPlayerProvider>
          </TenantProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
