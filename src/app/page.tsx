"use client";
import dynamic from "next/dynamic";
const PublicHome = dynamic(() => import("@/components/public/PublicHome"), {
  ssr: false, loading: () => <main className="grid h-screen place-items-center text-muted">Carregando…</main>,
});
export default function Page() { return <PublicHome />; }
