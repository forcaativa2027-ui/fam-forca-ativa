"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useDelegations } from "@/hooks/use-queries";
import { DELEGATION_MODULE_LABELS } from "@/services/delegations";
import { buildGroups, type TabKey, type AdminSidebarProps } from "../AdminSidebar";

export function MeuPainel({ profile, allowedTabKeys, counts, onNavigate }: {
  profile: { id: string; full_name: string; role: string } | null | undefined;
  allowedTabKeys: Set<string>;
  counts: AdminSidebarProps["counts"];
  onNavigate: (tab: TabKey) => void;
}) {
  const { data: myDelegations = [] } = useDelegations({ profile_id: profile?.id, status: "ativo" });
  const shortcuts = buildGroups(counts).flatMap((g) => g.items).filter((i) => allowedTabKeys.has(i.key as TabKey));

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meu Painel</p>
        <h1 className="font-display text-2xl text-navy">Olá, {profile?.full_name?.split(" ")[0] ?? "!"}</h1>
      </div>

      {myDelegations.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Suas delegações ativas</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {myDelegations.map((d) => (
              <Card key={d.id} className="border-l-4 border-l-gold">
                <CardContent className="py-3">
                  <p className="text-sm font-semibold text-navy">{DELEGATION_MODULE_LABELS[d.module] ?? d.module}</p>
                  <p className="text-xs text-muted-foreground">{d.scope_name || "—"}</p>
                  {d.expires_at && (
                    <p className="mt-0.5 text-[11px] text-amber-700">Válida até {new Date(d.expires_at).toLocaleDateString("pt-BR")}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Acesso rápido</p>
        {shortcuts.length === 0 ? (
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <h3 className="font-display text-lg text-navy">Nenhuma delegação ativa</h3>
              <p className="mt-2 text-sm text-muted">
                Fale com o Administrador Nacional, Estadual ou o Pastor Principal da sua igreja
                pra solicitar acesso a um módulo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shortcuts.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key as TabKey)}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="text-navy">{item.icon}</span>
                <span className="text-sm font-semibold text-navy">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
