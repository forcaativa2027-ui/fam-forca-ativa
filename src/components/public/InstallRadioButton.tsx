"use client";
import { useState } from "react";
import { Smartphone, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallRadioButton() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={() => setShowGuide(!showGuide)}>
        <PlusCircle className="h-4 w-4" />
        Adicionar Rádio Web à tela inicial
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