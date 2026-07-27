"use client";
import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappShareUrl, copyEventLink, canNativeShare, nativeShareEvent } from "@/lib/eventShare";
import type { RegistrationEvent } from "@/types/domain";

export function EventShareButtons({ event, size = "sm" }: { event: RegistrationEvent; size?: "sm" | "default" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await copyEventLink(event);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={whatsappShareUrl(event)} target="_blank" rel="noopener noreferrer">
        <Button type="button" size={size} variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.2c0 1.3 1 2.6 1.1 2.8.1.2 2 3 4.7 4.2a10 10 0 0 0 1.7.6c.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z"/></svg>
          WhatsApp
        </Button>
      </a>
      <Button type="button" size={size} variant="outline" onClick={copy} className="gap-1.5">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copiado!" : "Copiar link"}
      </Button>
      {canNativeShare() && (
        <Button type="button" size={size} variant="outline" onClick={() => nativeShareEvent(event)} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Compartilhar
        </Button>
      )}
    </div>
  );
}
