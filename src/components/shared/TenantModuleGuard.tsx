"use client";

import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyProfile, useTenantModules } from "@/hooks/use-queries";
import { isTenantModuleEnabled, TENANT_MODULE_DEFAULTS, type TenantModuleMap } from "@/services/tenantModules";

interface TenantModuleGuardProps {
  moduleKey: string;
  children: ReactNode;
  title?: string;
  description?: string;
  loadingLabel?: string;
  fallback?: ReactNode;
}

function ModuleState({ title, description, loading = false }: { title: string; description: string; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy">
          {!loading && <ShieldOff className="h-5 w-5 text-gold" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Protege páginas/sub-rotas directas com a configuração institucional do tenant.
 * Permissões individuais e roteamento continuam a ser responsabilidades separadas.
 */
export function TenantModuleGuard({
  moduleKey,
  children,
  title = "Módulo indisponível",
  description = "Este módulo não está activo para a organização actual.",
  loadingLabel = "A verificar configuração da organização…",
  fallback,
}: TenantModuleGuardProps) {
  const profileQuery = useMyProfile();
  const modulesQuery = useTenantModules(profileQuery.data?.church_id);
  const modules: TenantModuleMap = modulesQuery.data ?? TENANT_MODULE_DEFAULTS;

  if (profileQuery.isLoading || modulesQuery.isLoading) {
    return <ModuleState title="A carregar" description={loadingLabel} loading />;
  }

  if (!profileQuery.data) {
    return <ModuleState title="Sessão necessária" description="Inicie sessão para aceder a esta área." />;
  }

  if (!isTenantModuleEnabled(modules, moduleKey)) {
    return fallback ?? <ModuleState title={title} description={description} />;
  }

  return <>{children}</>;
}
