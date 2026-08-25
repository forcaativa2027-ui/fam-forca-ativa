"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, Home as HomeIcon, Check, MessageCircleHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase/client";
import { submitPrayer, submitVisit } from "@/services/publicForms";
import { publicPrayerFormSchema, visitFormSchema,
  type PublicPrayerFormInput, type VisitFormInput } from "@/schemas";

export function PublicContactForms({ churchId }: { churchId?: string | null } = {}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-navy">
        <MessageCircleHeart className="h-5 w-5 text-gold" />
        <h2 className="font-display text-2xl">Quero conversar</h2>
      </div>
      <p className="text-sm text-muted">
        Preencha seus dados e envie uma mensagem para a equipe de acolhimento da FAM.
      </p>

      <Tabs defaultValue="oracao">
        <TabsList>
          <TabsTrigger value="oracao"><Heart className="mr-1 h-3.5 w-3.5" />Preencha seus dados</TabsTrigger>
          <TabsTrigger value="visita"><HomeIcon className="mr-1 h-3.5 w-3.5" />Quero ser visitado</TabsTrigger>
        </TabsList>
        <TabsContent value="oracao"><PrayerForm churchId={churchId} /></TabsContent>
        <TabsContent value="visita"><VisitForm churchId={churchId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function PrayerForm({ churchId }: { churchId?: string | null }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<PublicPrayerFormInput>({ resolver: zodResolver(publicPrayerFormSchema) });

  async function onSubmit(v: PublicPrayerFormInput) {
    setErr("");
    try {
      await submitPrayer(supabase, {
        full_name: v.full_name, email: v.email, phone: v.phone,
        city: v.city, request: v.request, honeypot: v.website,
        church_id: churchId,
      });
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Não foi possível enviar agora. Tente novamente em instantes.");
    }
  }

  if (done) return (
    <Card className="border-gold/30 bg-gold/5">
      <CardContent className="pt-8 pb-8 text-center">
        <Check className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-display text-lg text-navy">Mensagem recebida</p>
        <p className="mt-1 text-sm text-muted">A equipe da FAM avaliará sua solicitação e entrará em contato quando possível.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Envie sua mensagem</CardTitle>
        <CardDescription>Conte-nos como podemos orientar você. Sua mensagem deve ser tratada com cuidado.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Honeypot anti-spam */}
          <input type="text" {...register("website")} tabIndex={-1} autoComplete="off"
            aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <Field label="Nome" error={errors.full_name?.message}>
            <Input {...register("full_name")} placeholder="Seu nome" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register("email")} placeholder="opcional" />
            </Field>
            <Field label="Telefone / WhatsApp" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="opcional" />
            </Field>
          </div>
          <Field label="Cidade" error={errors.city?.message}>
            <Input {...register("city")} placeholder="opcional" />
          </Field>
          <Field label="Sua mensagem" error={errors.request?.message}>
            <textarea {...register("request")} rows={4}
              className="w-full rounded-md border bg-background p-3 text-sm"
              placeholder="Escreva sua mensagem ou solicitação" />
          </Field>
          {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function VisitForm({ churchId }: { churchId?: string | null }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<VisitFormInput>({ resolver: zodResolver(visitFormSchema) });

  async function onSubmit(v: VisitFormInput) {
    setErr("");
    try {
      await submitVisit(supabase, {
        full_name: v.full_name, email: v.email, phone: v.phone,
        city: v.city, address: v.address, best_time: v.best_time,
        reason: v.reason, honeypot: v.website,
        church_id: churchId,
      });
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Não foi possível enviar agora. Tente novamente em instantes.");
    }
  }

  if (done) return (
    <Card className="border-gold/30 bg-gold/5">
      <CardContent className="pt-8 pb-8 text-center">
        <Check className="mx-auto h-10 w-10 text-gold" />
        <p className="mt-3 font-display text-lg text-navy">Solicitação recebida</p>
        <p className="mt-1 text-sm text-muted">A equipe de acolhimento entrará em contato em breve.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quero ser contatada</CardTitle>
        <CardDescription>Solicite contato da equipe da FAM no melhor horário para você.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Honeypot anti-spam */}
          <input type="text" {...register("website")} tabIndex={-1} autoComplete="off"
            aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

          <Field label="Nome" error={errors.full_name?.message}>
            <Input {...register("full_name")} placeholder="Seu nome" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Telefone / WhatsApp" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="Obrigatório" />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register("email")} placeholder="opcional" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cidade" error={errors.city?.message}>
              <Input {...register("city")} />
            </Field>
            <Field label="Melhor horário" error={errors.best_time?.message}>
              <Input {...register("best_time")} placeholder="Ex: noite, sábado de manhã" />
            </Field>
          </div>
          <Field label="Endereço" error={errors.address?.message}>
            <Input {...register("address")} placeholder="Rua, número, bairro" />
          </Field>
          <Field label="Como podemos te servir?" error={errors.reason?.message}>
            <textarea {...register("reason")} rows={3}
              className="w-full rounded-md border bg-background p-3 text-sm"
              placeholder="Compartilhe brevemente" />
          </Field>
          {err && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
