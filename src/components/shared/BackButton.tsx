"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

export function BackButton({ fallbackHref = "/", className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      className={`gap-2 ${className}`}
      aria-label="Voltar à página anterior"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Voltar à página anterior
    </Button>
  );
}
