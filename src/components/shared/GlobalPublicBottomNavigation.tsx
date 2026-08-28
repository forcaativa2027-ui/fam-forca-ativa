"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  HeartHandshake,
  Home,
  MessageCircle,
  Newspaper,
  Radio,
  ShieldAlert,
  Sparkles,
  Users2,
  Video,
} from "lucide-react";
import { BottomNav, BottomNavSpacer, type BottomNavItem } from "./BottomNav";
import { useOrgTerminology } from "@/hooks/use-queries";
import { ORG_TERM_DEFAULTS } from "@/services/orgTerminology";
import { PUBLIC_FAM_TENANT_ID } from "@/services/organizationConfig";

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
  const { data: terms = ORG_TERM_DEFAULTS } = useOrgTerminology(PUBLIC_FAM_TENANT_ID);

  // PublicHome e PanelDashboard já renderizam a navegação contextual completa.
  // A barra global cobre as páginas públicas que não passam por esses componentes.
  const isCoveredByLocalNav = pathname === "/" || pathname === "/painel";
  const isHidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isCoveredByLocalNav || isHidden) return null;

  const goHome = (tab?: string) => router.push(tab ? `/?tab=${tab}` : "/");
  const items: BottomNavItem[] = [
    { key: "inicio", label: "Início", icon: <Home size={18} />, onClick: () => goHome() },
    { key: "noticias", label: "Notícias", icon: <Newspaper size={18} />, onClick: () => goHome("noticias") },
    { key: "agenda", label: "Agenda", icon: <Calendar size={18} />, onClick: () => goHome("agenda") },
    { key: "grupo", label: terms.life_group, icon: <Users2 size={18} />, onClick: () => goHome("participar") },
    { key: "conteudo", label: terms.more_brand, icon: <Sparkles size={18} />, onClick: () => router.push("/painel/cecmais") },
    { key: "contato", label: "Contato", icon: <MessageCircle size={18} />, onClick: () => goHome("contato") },
    { key: "risco", label: "Proteção", icon: <ShieldAlert size={18} />, onClick: () => router.push("/analise-risco") },
  ];

  return (
    <>
      <BottomNavSpacer />
      <BottomNav items={items} activeKey={pathname === "/analise-risco" ? "risco" : pathname.startsWith("/jornada-conhecimento") ? "conteudo" : "inicio"} />
    </>
  );
}
