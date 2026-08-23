"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Dashboard from "@/components/Dashboard";

export default function HomeClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <main style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--muted)" }}>Carregando…</main>;
  return session ? <Dashboard /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at 30% 20%, #16345A, #0E2A47 60%)" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 36, borderRadius: 20, width: 380, boxShadow: "0 30px 80px rgba(0,0,0,.35)", animation: "rise .5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--gold)", fontSize: 22 }}>✦</span>
          <h1 style={{ color: "var(--navy)", fontSize: 26, letterSpacing: 0.5 }}>CEC FAMILY</h1>
        </div>
        <div style={{ height: 3, width: 64, background: "var(--gold)", margin: "12px 0 8px", borderRadius: 2 }} />
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 22 }}>Governo pastoral e Life Groups</p>
        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
        {err && <p style={{ color: "#B91C1C", fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button disabled={busy} style={btn}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 13, marginBottom: 12, border: "1px solid var(--border)", borderRadius: 11, fontSize: 15, fontFamily: "var(--body)", background: "var(--bg)" };
const btn: React.CSSProperties = { width: "100%", padding: 14, background: "var(--gold)", color: "var(--navy)", fontWeight: 800, border: "none", borderRadius: 11, fontSize: 16, cursor: "pointer", fontFamily: "var(--body)" };
