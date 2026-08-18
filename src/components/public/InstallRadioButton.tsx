"use client";
import { useEffect, useState } from "react";
import { PlusCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallRadioButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowGuide((s) => !s);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={handleInstall}>
        {deferredPrompt ? <Download className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
        {deferredPrompt ? "Instalar Rádio Web" : "Adicionar Rádio Web à tela inicial"}
      </Button>
      {showGuide && (
        <div className="rounded-lg bg-gold/5 border border-gold/20 p-4 text-sm space-y-2">
          <p className="font-bold text-navy">Como instalar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>No iPhone (Safari): toque em Compartilhar → "Adicionar à Tela de Início"</li>
            <li>No Android (Chrome): toque em ⋮ → "Adicionar à tela inicial"</li>
            <li>No computador (Chrome): clique no ícone de instalação na barra de endereço</li>
          </ol>
        </div>
      )}
    </div>
  );
}