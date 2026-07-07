"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Cake } from "lucide-react";
import { MemberScoreAdmin } from "./MemberScoreAdmin";
import { BirthdaysAdmin } from "./BirthdaysAdmin";

/**
 * Substitui o antigo ScoresBirthdaysPlaceholder. O backend do módulo C20
 * (views member_score, birthday_today, birthday_month, birthday_upcoming)
 * já existe e foi confirmado em produção — só a UI nunca tinha sido ligada.
 */
export function ScoresBirthdaysAdmin() {
  return (
    <Tabs defaultValue="score" className="space-y-4">
      <TabsList>
        <TabsTrigger value="score" className="gap-1.5"><Star size={14} /> Score</TabsTrigger>
        <TabsTrigger value="birthdays" className="gap-1.5"><Cake size={14} /> Aniversários</TabsTrigger>
      </TabsList>
      <TabsContent value="score"><MemberScoreAdmin /></TabsContent>
      <TabsContent value="birthdays"><BirthdaysAdmin /></TabsContent>
    </Tabs>
  );
}
