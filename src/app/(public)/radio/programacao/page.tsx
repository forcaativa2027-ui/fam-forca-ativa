"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RadioSchedule } from "@/components/radio/RadioSchedule";

export default function RadioProgramacaoPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy">Programação</h1>
            <p className="mt-1 text-muted">Grade semanal da Rádio Web</p>
          </div>
          <Link
            href="/radio"
            className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao player
          </Link>
        </header>
        <RadioSchedule />
      </div>
    </div>
  );
}
