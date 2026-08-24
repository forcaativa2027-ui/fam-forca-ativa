"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  href?: string;
}

export function Header({ title, showBackButton = true, href = "/" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-fam-plum text-white shadow-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link
              href={href}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">FAM</p>
            <h1 className="font-display text-lg font-bold tracking-wide">{title}</h1>
          </div>
        </div>
        <div className="w-10" />
      </div>
    </header>
  );
}
