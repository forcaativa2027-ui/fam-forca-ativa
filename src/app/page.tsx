"use client";
import dynamic from "next/dynamic";

// Carrega o painel só no cliente (evita prerender no servidor da Vercel).
const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
  loading: () => <main style={{ display: "grid", placeItems: "center", height: "100vh", color: "#6B7C93" }}>Carregando…</main>,
});

export default function Page() {
  return <HomeClient />;
}
