"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useMyProfile, useChurchGivingInfo } from "@/hooks/use-queries";
import { upsertChurchGivingInfo } from "@/services/giving";

/**
 * Momento da Generosidade — cadastro do QR Code Pix, chave, razão
 * social, CNPJ e banco que aparecem na aba pública "Dízimos e
 * Ofertas".
 */
export function GivingAdmin() {
  const { data: me } = useMyProfile();
  const churchId = me?.church_id ?? null;
  const { data: giving } = useChurchGivingInfo(churchId);

  const [qrUrl, setQrUrl] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [banco, setBanco] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (giving) {
      setQrUrl(giving.qr_code_url ?? "");
      setPixKey(giving.pix_key ?? "");
      setRazaoSocial(giving.razao_social ?? "");
      setCnpj(giving.cnpj ?? "");
      setBanco(giving.banco ?? "");
    }
  }, [giving]);

  async function save() {
    if (!churchId) return;
    setBusy(true); setSaved(false);
    try {
      await upsertChurchGivingInfo(supabase, {
        church_id: churchId, qr_code_url: qrUrl || undefined, pix_key: pixKey || undefined,
        razao_social: razaoSocial || undefined, cnpj: cnpj || undefined, banco: banco || undefined,
      });
      qc.invalidateQueries({ queryKey: ["church-giving-info", churchId] });
      setSaved(true);
    } finally { setBusy(false); }
  }

  if (!churchId) return <p className="p-4 text-sm text-muted-foreground">Seu perfil não está vinculado a uma igreja.</p>;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl text-navy"><HeartHandshake className="h-5 w-5 text-gold" />Momento da Generosidade</h2>
        <p className="text-sm text-muted-foreground">Dados que aparecem na aba pública "Dízimos e Ofertas".</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de contribuição</CardTitle>
          <CardDescription>
            A imagem do QR Code precisa estar hospedada num link (ex: envie a imagem pra uma pasta pública do
            Google Drive/Supabase Storage e cole o link direto da imagem aqui).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">URL da imagem do QR Code Pix</Label><Input value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://…/qrcode.png" /></div>
          {qrUrl && <img src={qrUrl} alt="Pré-visualização" className="h-40 w-40 rounded-lg border object-contain" />}
          <div><Label className="text-xs">Chave Pix</Label><Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CNPJ, e-mail, telefone ou chave aleatória" /></div>
          <div><Label className="text-xs">Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Comunidade Evangélica Cristã de Águas Claras" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="62.389.818/0001-03" /></div>
            <div><Label className="text-xs">Banco</Label><Input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Banco Cora" /></div>
          </div>
          <Button onClick={save} disabled={busy} className="w-full">{busy ? "Salvando…" : saved ? "Salvo!" : "Salvar"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
