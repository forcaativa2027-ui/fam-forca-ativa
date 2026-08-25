"use client";
import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";

export function radioBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://cec-painel.vercel.app";
}

export function shareTextFor(title: string): string {
  return `Ouça "${title}" na Rádio Web CEC Family 🎙️`;
}

export function ShareButtons({
  title,
  url,
  compact,
}: {
  title: string;
  url: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = shareTextFor(title);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — ignora
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // usuário cancelou
      }
    } else {
      copy();
    }
  };

  const btn = "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={nativeShare}
        aria-label="Compartilhar"
        className={`${btn} border border-gold/30 text-navy hover:bg-gold/10`}
      >
        <Share2 className="h-3.5 w-3.5" />
        {!compact && "Compartilhar"}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no WhatsApp"
        className={`${btn} bg-green-600 text-white hover:bg-green-700`}
      >
        <span className="font-bold">WhatsApp</span>
      </a>
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no X"
        className={`${btn} bg-navy text-white hover:bg-navy/80`}
      >
        <span className="font-bold">X</span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar link"
        className={`${btn} border border-gold/30 text-navy hover:bg-gold/10`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
        {!compact && (copied ? "Copiado!" : "Copiar link")}
      </button>
    </div>
  );
}