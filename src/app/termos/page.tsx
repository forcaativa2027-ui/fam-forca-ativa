import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Termos de Uso — FAM" };

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-fam-plum px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-semibold text-fam-plum hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-display text-3xl font-bold text-fam-plum">Termos de Uso</h1>
        <div className="my-3 h-[3px] w-16 rounded bg-fam-gold" />
        <p className="text-xs text-muted-foreground mb-6">Última atualização: junho de 2025</p>

        <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
          <h2 className="font-bold text-fam-plum">1. Aceitação dos Termos</h2>
          <p>
            Ao se cadastrar na plataforma <strong>FAM — Força Ativa da Mulher</strong>, você concorda com estes Termos de Uso e com
            a nossa <Link href="/privacidade" className="text-[#C9A227] hover:underline">Política de Privacidade</Link>.
            Caso não concorde, não realize o cadastro.
          </p>

          <h2 className="font-bold text-fam-plum">2. Quem somos</h2>
          <p>
            A FAM — Força Ativa da Mulher é um instituto que utiliza esta plataforma para acolhimento,
            comunicação, projetos sociais, voluntariado, participação de associados e organização institucional.
          </p>

          <h2 className="font-bold text-fam-plum">3. Uso adequado</h2>
          <p>Você se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer informações verdadeiras e atualizadas no cadastro;</li>
            <li>Manter sua senha em sigilo e não compartilhá-la com terceiros;</li>
            <li>Utilizar a plataforma exclusivamente para finalidades institucionais, sociais e de acolhimento;</li>
            <li>Não utilizar a plataforma para fins comerciais, difamatórios ou ilegais;</li>
            <li>Respeitar a privacidade dos demais membros cadastrados.</li>
          </ul>

          <h2 className="font-bold text-fam-plum">4. Dados fornecidos</h2>
          <p>
            Os dados cadastrados (nome, telefone, e-mail, localização e informações fornecidas em atendimentos) são utilizados
            para as finalidades institucionais informadas pela FAM. Não vendemos, alugamos ou compartilhamos seus dados com terceiros
            sem seu consentimento, exceto quando exigido por lei ou necessário para encaminhamento à rede oficial de proteção.
          </p>

          <h2 className="font-bold text-fam-plum">5. Conta e acesso</h2>
          <p>
            O acesso é vinculado ao seu e-mail e senha. Você é responsável por todas as ações realizadas com
            sua conta. Em caso de suspeita de acesso não autorizado, entre em contato imediatamente com a liderança.
          </p>

          <h2 className="font-bold text-fam-plum">6. Encerramento de conta</h2>
          <p>
            Você pode solicitar o encerramento de sua conta e a exclusão dos seus dados a qualquer momento,
            entrando em contato com a administração do Instituto FAM através dos canais oficiais.
          </p>

          <h2 className="font-bold text-fam-plum">7. Modificações</h2>
          <p>
            Estes termos podem ser atualizados periodicamente. Notificaremos os usuários em caso de alterações
            relevantes. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.
          </p>

          <h2 className="font-bold text-fam-plum">8. Contato</h2>
          <p>
            Dúvidas sobre estes termos? Entre em contato com a administração do Instituto FAM.
          </p>
        </div>
      </div>
    </main>
  );
}
