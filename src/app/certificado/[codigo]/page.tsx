"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldX, GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { verifyCertificate, type CertificateVerification } from "@/services/knowledgePoints";

/**
 * CEC Academy — Extensão 4.2. Verificação pública de certificado —
 * qualquer pessoa (sem login) pode conferir se um código de
 * certificado é autêntico, escaneando o QR ou digitando o link.
 */
export default function VerificarCertificadoPage({ params }: { params: { codigo: string } }) {
  const [result, setResult] = useState<CertificateVerification | null | "loading">("loading");

  useEffect(() => {
    verifyCertificate(supabase, params.codigo).then(setResult);
  }, [params.codigo]);

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_30%_20%,#16345A,#0E2A47_60%)] p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6 text-[#C9A227]" />
          <span className="font-display text-lg font-bold text-[#0E2A47]">CEC Academy</span>
        </div>

        {result === "loading" && (
          <div className="py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0E2A47]" /></div>
        )}

        {result === null && (
          <div className="space-y-3 py-4">
            <ShieldX className="mx-auto h-14 w-14 text-red-500" />
            <h1 className="font-display text-xl font-bold text-[#0E2A47]">Certificado não encontrado</h1>
            <p className="text-sm text-muted-foreground">O código <span className="font-mono">{params.codigo}</span> não corresponde a nenhum certificado emitido pela plataforma.</p>
          </div>
        )}

        {result && result !== "loading" && (
          <div className="space-y-3 py-4">
            <ShieldCheck className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="font-display text-xl font-bold text-[#0E2A47]">Certificado válido</h1>
            <div className="rounded-xl border-2 border-[#C9A227]/30 bg-[#C9A227]/5 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Certifica que</p>
              <p className="font-display text-lg text-[#0E2A47]">{result.member_name}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Concluiu o curso</p>
              <p className="font-semibold text-[#0E2A47]">{result.course_name}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Emitido em</p>
              <p className="text-sm text-[#0E2A47]">{new Date(result.issued_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">Código: {result.certificate_code}</p>
          </div>
        )}

        <Link href="/" className="mt-4 inline-block text-sm text-muted-foreground underline hover:text-[#0E2A47]">Voltar ao CEC Family</Link>
      </div>
    </main>
  );
}
