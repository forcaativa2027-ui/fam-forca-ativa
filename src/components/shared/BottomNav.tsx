"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Comparação customizada de "ativo" (por padrão compara o pathname exato) */
  isActive?: (pathname: string) => boolean;
}

/**
 * Menu fixo embaixo da tela, com rolagem horizontal pra caber mais
 * itens do que a largura da tela (igual apps de igreja de referência).
 * Reutilizável — quem usa passa a própria lista de itens.
 */
export function BottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B2038]/95 backdrop-blur">
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2 py-1.5">
        {items.map((item) => {
          const active = item.isActive ? item.isActive(pathname) : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex min-w-[68px] shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition ${
                active ? "text-gold" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
