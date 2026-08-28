"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  HeartHandshake,
  Home,
  LogIn,
  MessageCircle,
  Newspaper,
  Radio,
  ShieldAlert,
  Sparkles,
  Video,
  BookOpen,
} from "lucide-react";
import { BottomNav, BottomNavSpacer, type BottomNavItem } from "./BottomNav";

const HIDDEN_PREFIXES = [
  "/entrar",
  "/cadastro",
  "/recuperar-senha",
  "/admin",
  "/auth",
];

export function GlobalPublicBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  // PublicHome já renderiza a mesma sequência; as páginas públicas secundárias
  // reutilizam esta lista fixa para não reduzir nem trocar os atalhos ao navegar.
  const isCoveredByLocalNav = pathname === "/" || pathname === "/painel";
  const isHidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isCoveredByLocalNav || isHidden) return null;

  const goHome = (tab?: string) => router.push(tab ? `/?tab=${tab}` : "/");
  const items: BottomNavItem[] = [
    { key: "inicio", label: "Início", icon: <Home size={18} />, onClick: () => goHome() },
    { key: "noticias", label: "Notícias", icon: <Newspaper size={18} />, onClick: () => goHome("noticias") },
    { key: "radio", label: "Rádio Web", icon: <Radio size={18} />, onClick: () => goHome("radio") },
    { key: "videos", label: "FAM Vídeos", icon: <Video size={18} />, onClick: () => goHome("videos") },
    { key: "agenda", label: "Agenda", icon: <Calendar size={18} />, onClick: () => goHome("agenda") },
    { key: "participar", label: "Participar", icon: <Sparkles size={18} />, onClick: () => goHome("participar") },
    { key: "contato", label: "Fale Conosco", icon: <MessageCircle size={18} />, onClick: () => goHome("contato") },
    { key: "risco", label: "Análise de Risco", icon: <ShieldAlert size={18} />, onClick: () => router.push("/analise-risco") },
    { key: "ofertar", label: "Doação", icon: <HeartHandshake size={18} />, onClick: () => goHome("ofertar") },
    { key: "conhecimento", label: "Conheça seus direitos", icon: <BookOpen size={18} />, onClick: () => router.push("/jornada-conhecimento") },
    { key: "entrar", label: "Entrar", icon: <LogIn size={18} />, onClick: () => router.push("/entrar") },
  ];

  return (
    <>
      <BottomNavSpacer />
      <BottomNav items={items} activeKey={pathname === "/analise-risco" ? "risco" : pathname.startsWith("/jornada-conhecimento") ? "conhecimento" : "inicio"} />
    </>
  );
}
