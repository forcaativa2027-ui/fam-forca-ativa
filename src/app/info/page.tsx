import Link from "next/link";
import { BookOpen, GraduationCap, Library, Scale, Search, ArrowRight, Heart, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InfoPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">INFO · Conhecimento que Protege</p>
        <h1 className="mt-3 font-display text-4xl text-fam-plum">Conhecimento que Protege</h1>
        <p className="mt-3 text-fam-muted">Transformamos fontes oficiais em jornadas simples sobre direitos, proteção e rede de atendimento. Você escolhe por onde começar.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fam-muted" />
            <Input placeholder="Busque: &quot;Ele controla meu dinheiro&quot;, &quot;medida protetiva&quot;, &quot;violência psicológica&quot;" className="pl-9" id="info-search" />
          </div>
          <Button asChild><Link href="/info/busca">Buscar</Link></Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <Link href="/info?nivel=entenda_2min" className="group">
          <Card className="h-full hover:border-fam-magenta/30 hover:shadow-md transition">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-fam-soft-pink flex items-center justify-center"><BookOpen className="h-5 w-5 text-fam-magenta" /></div>
              <CardTitle className="text-lg">Quero entender</CardTitle>
              <CardDescription>Informação rápida, linguagem cotidiana. Em 2 minutos.</CardDescription>
            </CardHeader>
            <CardContent><span className="text-sm font-medium text-fam-magenta group-hover:underline flex items-center gap-1">Explorar <ArrowRight className="h-4 w-4" /></span></CardContent>
          </Card>
        </Link>
        <Link href="/info/trilhas" className="group">
          <Card className="h-full hover:border-fam-magenta/30 hover:shadow-md transition">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-fam-soft-pink flex items-center justify-center"><GraduationCap className="h-5 w-5 text-fam-magenta" /></div>
              <CardTitle className="text-lg">Quero aprender</CardTitle>
              <CardDescription>Jornadas estruturadas por tema.</CardDescription>
            </CardHeader>
            <CardContent><span className="text-sm font-medium text-fam-magenta group-hover:underline flex items-center gap-1">Ver trilhas <ArrowRight className="h-4 w-4" /></span></CardContent>
          </Card>
        </Link>
        <Link href="/info?nivel=aprofunde" className="group">
          <Card className="h-full hover:border-fam-magenta/30 hover:shadow-md transition">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-fam-soft-pink flex items-center justify-center"><Library className="h-5 w-5 text-fam-magenta" /></div>
              <CardTitle className="text-lg">Quero me aprofundar</CardTitle>
              <CardDescription>Conteúdo detalhado e fontes oficiais.</CardDescription>
            </CardHeader>
            <CardContent><span className="text-sm font-medium text-fam-magenta group-hover:underline flex items-center gap-1">Aprofundar <ArrowRight className="h-4 w-4" /></span></CardContent>
          </Card>
        </Link>
        <Link href="/info/fontes" className="group">
          <Card className="h-full hover:border-fam-magenta/30 hover:shadow-md transition">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-fam-soft-pink flex items-center justify-center"><Scale className="h-5 w-5 text-fam-magenta" /></div>
              <CardTitle className="text-lg">Fontes oficiais</CardTitle>
              <CardDescription>Leis, guias e documentos governamentais.</CardDescription>
            </CardHeader>
            <CardContent><span className="text-sm font-medium text-fam-magenta group-hover:underline flex items-center gap-1">Consultar <ArrowRight className="h-4 w-4" /></span></CardContent>
          </Card>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-fam-magenta" /> Trilha inicial: Conhecendo meus direitos</CardTitle>
            <CardDescription>Comece por aqui — 3 conteúdos (2 + 8 + 12 min) com fontes oficiais rastreáveis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-fam-magenta text-white flex items-center justify-center text-xs">1</span> Entenda em 2 minutos: o que são direitos?</li>
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-fam-lavender text-fam-plum flex items-center justify-center text-xs">2</span> Aprenda: dignidade, liberdade e igualdade</li>
              <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-fam-lavender text-fam-plum flex items-center justify-center text-xs">3</span> Aprofunde: acesso à informação e serviços</li>
            </ol>
            <Button asChild className="w-full"><Link href="/info/trilha/conhecendo-meus-direitos">Começar trilha</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-fam-magenta" /> Mapa → INFO</CardTitle>
            <CardDescription>Após uma orientação, entenda melhor o tema sem atrasar emergência.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" asChild className="w-full"><Link href="/analise-risco">Fazer Mapa de Risco</Link></Button>
            <Button variant="ghost" asChild className="w-full"><Link href="/fale-conosco">Fale com atendente</Link></Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-fam-muted max-w-2xl mx-auto">Conteúdos com fonte oficial rastreável. Última verificação exibida em cada fonte. Progressão sugerida ≠ conteúdo bloqueado.</p>
    </div>
  );
}
