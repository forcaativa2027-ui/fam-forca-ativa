"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getRadioListenerByToken, unsubscribeRadioListener } from "@/services/radio";

export default function RadioUnsubscribePage() {
  const [status, setStatus] = useState<"loading" | "done" | "notfound" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("notfound");
      return;
    }
    getRadioListenerByToken(supabase, token)
      .then(async (listener) => {
        if (!listener) {
          setStatus("notfound");
          return;
        }
        setEmail(listener.email);
        const ok = await unsubscribeRadioListener(supabase, token);
        setStatus(ok ? "done" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-lg">
        <header className="mb-6">
          <Link
            href="/radio"
            className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao player
          </Link>
        </header>

        <div className="rounded-xl border border-gold/30 p-8 text-center">
          {status === "loading" && (
            <p className="text-muted">Carregando...</p>
          )}

          {status === "done" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
              <h1 className="mt-3 font-display text-xl font-bold text-navy">Inscrição cancelada</h1>
              <p className="mt-2 text-sm text-muted">
                {email ? (
                  <>
                    O e-mail <strong className="text-navy">{email}</strong> não receberá mais avisos
                    da rádio.
                  </>
                ) : (
                  "Você não receberá mais avisos da rádio."
                )}
              </p>
            </>
          )}

          {status === "notfound" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-red-500" />
              <h1 className="mt-3 font-display text-xl font-bold text-navy">Link inválido</h1>
              <p className="mt-2 text-sm text-muted">
                Não encontramos esta inscrição. Verifique se o link está completo.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-red-500" />
              <h1 className="mt-3 font-display text-xl font-bold text-navy">Algo deu errado</h1>
              <p className="mt-2 text-sm text-muted">Tente novamente em instantes.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}