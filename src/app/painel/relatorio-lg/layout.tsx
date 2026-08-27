import type { ReactNode } from "react";
import { TenantModuleGuard } from "@/components/shared/TenantModuleGuard";

export default function RelatorioLgLayout({ children }: { children: ReactNode }) {
  return (
    <TenantModuleGuard
      moduleKey="life_groups"
      title="Relatórios de grupos desactivados"
      description="Este módulo não está activo para a organização actual. Os dados históricos foram preservados."
    >
      {children}
    </TenantModuleGuard>
  );
}
