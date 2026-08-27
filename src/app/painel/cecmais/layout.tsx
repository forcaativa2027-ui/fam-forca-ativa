import type { ReactNode } from "react";
import { TenantModuleGuard } from "@/components/shared/TenantModuleGuard";

export default function CecmaisLayout({ children }: { children: ReactNode }) {
  return (
    <TenantModuleGuard
      moduleKey="cecmais"
      title="FAM Mais indisponível"
      description="Este módulo não está activo para a organização actual. Os conteúdos existentes foram preservados."
    >
      {children}
    </TenantModuleGuard>
  );
}
