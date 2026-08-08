"use client";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyProfile, useMyActiveModules, usePendingCounts, useMfaRequired, useMfaFactors } from "@/hooks/use-queries";
import { AdminSidebar, type TabKey } from "./AdminSidebar";
import { GlobalSearchDialog } from "./GlobalSearchDialog";
import { GlobalSearch } from "./GlobalSearch";
import { TabContent } from "./panel/TabRouter";

export default function AdminPanel() {
  const { data: me, isLoading } = useMyProfile();
  const { data: counts } = usePendingCounts();
  const { data: myModules = [] } = useMyActiveModules();
  const isAdmin = me && (me.role === "apostolo" || myModules.length > 0);
  const { data: mfaRequired } = useMfaRequired(me?.id ?? null);
  const { data: mfaFactorsList = [] } = useMfaFactors();
  const mfaVerified = mfaFactorsList.some((f) => f.status === "verified");

  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;
  const prefillEventId = searchParams.get("prefillEvent");
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab ?? "org-dashboard");
  const [previousTab, setPreviousTab] = useState<TabKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleNavigate = useCallback((tab: TabKey) => {
    setActiveTab((prev) => {
      setPreviousTab(prev);
      return tab;
    });
  }, []);

  if (isLoading) {
    return (
      <main className="grid h-screen place-items-center text-muted">Carregando…</main>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="font-display text-xl text-navy">Acesso restrito</h2>
            <p className="mt-2 text-sm text-muted">
              O painel administrativo exige uma delegação ativa. Fale com o Administrador
              Nacional, Estadual ou o Pastor Principal da sua igreja pra solicitar acesso.
            </p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/painel">← Voltar ao painel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mfaRequired && !mfaVerified) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-5">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="mt-2 font-display text-xl text-navy">Ative a autenticação de dois fatores</h2>
            <p className="mt-2 text-sm text-muted">
              Sua conta tem acesso administrativo — por segurança (UX-004), é obrigatório ativar
              o 2FA antes de continuar. Leva menos de 2 minutos.
            </p>
            <Button asChild className="mt-4">
              <Link href="/painel/seguranca">Ativar agora</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar (desktop: fixa; mobile: via drawer interno) ── */}
      <AdminSidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        counts={{
          prayer_pending: counts?.prayer_pending ?? 0,
          visit_pending: counts?.visit_pending ?? 0,
          pipeline_new: counts?.pipeline_new ?? 0,
        }}
        userName={me?.full_name ?? undefined}
        userRole={me?.role ?? undefined}
        onSearch={() => setSearchOpen(true)}
      />

      {/* ── Área principal ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header — apenas mobile (desktop usa sidebar lateral) */}
        <header className="border-b-[3px] border-gold bg-navy md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3 text-white">
              {/* Botão hamburger renderizado pelo AdminSidebar mobileOnly */}
              <AdminSidebar
                activeTab={activeTab}
                onNavigate={handleNavigate}
                counts={{
                  prayer_pending: counts?.prayer_pending ?? 0,
                  visit_pending: counts?.visit_pending ?? 0,
                  pipeline_new: counts?.pipeline_new ?? 0,
                }}
                userName={me?.full_name ?? undefined}
                userRole={me?.role ?? undefined}
                onSearch={() => setSearchOpen(true)}
                mobileOnly
              />
              <span className="font-display text-sm font-semibold text-white/70">CEC Family</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/painel">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Painel
              </Link>
            </Button>
          </div>
        </header>

        {/* Busca global — sempre montada para capturar Ctrl+K */}
        <GlobalSearch
          onNavigate={(tab) => {
            handleNavigate(tab as TabKey);
          }}
        />

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8">
            {previousTab === "org-dashboard" && activeTab !== "org-dashboard" && (
              <Button
                variant="outline" size="sm"
                className="mb-4 gap-1.5"
                onClick={() => handleNavigate("org-dashboard")}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Dashboard
              </Button>
            )}
            <TabContent activeTab={activeTab} onNavigate={handleNavigate} prefillEventId={prefillEventId} />
          </div>
        </main>
      </div>

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleNavigate} />
    </div>
  );
}
