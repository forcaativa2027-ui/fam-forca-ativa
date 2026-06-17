"use client";
import dynamic from "next/dynamic";

const AdminClient = dynamic(() => import("@/components/Admin"), {
  ssr: false,
  loading: () => <main style={{ display: "grid", placeItems: "center", height: "100vh", color: "#6B7C93" }}>Carregando…</main>,
});

export default function AdminPage() {
  return <AdminClient />;
}
