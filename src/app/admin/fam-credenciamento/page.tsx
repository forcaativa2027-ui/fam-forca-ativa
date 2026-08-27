import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FamProfessionalAccessAdmin } from "@/components/admin/FamProfessionalAccessAdmin";
import { createClient } from "@/lib/supabase/server";

export default async function FamCredenciamentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/admin/fam-credenciamento");

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">FAM · governança</p>
          <h1 className="mt-2 font-display text-3xl text-fam-plum">Credenciamento e acesso profissional</h1>
          <p className="mt-2 max-w-3xl text-sm text-fam-muted">
            AC-02 e POL-ARQ-01: acesso sensível depende de identidade individual, finalidade, escopo, validade e autorização verificável. Cargo ou hierarquia, isoladamente, não concede acesso.
          </p>
        </header>
        <Card className="border-fam-gold/30 bg-fam-gold-soft/10">
          <CardContent className="flex gap-3 p-4 text-sm text-fam-deep-plum">
            <p><strong>Importante:</strong> esta área administra credenciamentos e decisões de autorização. Ela não exibe o conteúdo dos casos e não activa profissionais automaticamente.</p>
          </CardContent>
        </Card>
        <FamProfessionalAccessAdmin />
      </div>
    </main>
  );
}
