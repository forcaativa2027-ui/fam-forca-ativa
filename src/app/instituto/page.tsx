import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, HeartHandshake, Home, Instagram, Mail, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const projects = [
  { title: "Mulher por Trás do Silêncio", text: "Acolhimento, orientação e fortalecimento de mulheres que enfrentam violência doméstica, promovendo autoestima, autonomia e novos caminhos.", icon: ShieldCheck, tone: "bg-fam-soft-pink text-fam-purple" },
  { title: "Sonho de Princesas", text: "Ações que ajudam meninas e famílias em situação de vulnerabilidade a celebrarem momentos importantes com dignidade e alegria.", icon: Sparkles, tone: "bg-fam-purple-light text-fam-plum" },
  { title: "Casamento Coletivo", text: "Realização de sonhos e construção de memórias para famílias que não tiveram oportunidade de celebrar sua união.", icon: HeartHandshake, tone: "bg-fam-peach/25 text-fam-plum" },
  { title: "Lar dos Sonhos", text: "Mobilização para reforma ou construção de moradias, levando conforto, segurança e dignidade a famílias vulneráveis.", icon: Home, tone: "bg-fam-gold-soft/25 text-fam-plum" },
  { title: "FAM CUP", text: "Campeonato de futsal feminino criado para potencializar talentos, convivência e autoestima por meio do esporte.", icon: Users, tone: "bg-fam-lilac/25 text-fam-purple" },
  { title: "Formação e oportunidades", text: "Palestras, capacitações e apoio profissional para fortalecer emocionalmente e ampliar oportunidades de trabalho.", icon: CalendarDays, tone: "bg-fam-coral/20 text-fam-plum" },
];

export default function InstitutoPage() {
  return (
    <main className="min-h-screen bg-fam-background text-fam-ink">
      <header className="border-b border-fam-gold/40 bg-fam-plum text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Voltar para a página inicial">
            <Image src="/brand/fam-logo.jpg" alt="Logo do Instituto FAM — Força Ativa da Mulher" width={54} height={54} className="rounded-full bg-white object-contain p-1" priority />
            <span className="hidden font-display text-sm font-bold tracking-wide sm:inline">FAM · FORÇA ATIVA DA MULHER</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/fale-conosco">Fale com a FAM</Link>
            </Button>
            <Button asChild className="bg-fam-pink text-white hover:bg-fam-rose"><Link href="/analise-risco">Análise de Risco</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-fam-plum via-fam-purple to-fam-night">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
          <div className="relative z-10">
            <span className="inline-flex rounded-full border border-fam-gold-soft/80 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-fam-gold-soft">Instituto FAM</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-white md:text-6xl">Força, acolhimento e novas possibilidades.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">Há mais de quatorze anos, a FAM desenvolve ações para mulheres, famílias e pessoas em situação de vulnerabilidade, promovendo valorização, autoestima, apoio e capacitação.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-fam-pink text-white hover:bg-fam-rose"><Link href="/fale-conosco">Conheça nossos canais <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/#inicio">Voltar à página inicial</Link></Button>
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-sm items-center justify-center rounded-[2rem] border border-fam-gold/50 bg-white/95 p-10 shadow-2xl shadow-fam-night/30">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-fam-gold-soft/80 blur-2xl" />
            <Image src="/brand/fam-logo.jpg" alt="Instituto FAM — Força Ativa da Mulher" width={270} height={270} className="relative h-auto w-full rounded-2xl object-contain" priority />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-start">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-fam-pink">Nossa história</p><h2 className="mt-3 font-display text-3xl font-semibold text-fam-plum md:text-4xl">Uma rede que acredita na transformação.</h2></div>
          <div className="space-y-4 text-base leading-relaxed text-fam-muted"><p>O trabalho da FAM nasceu do acolhimento e da orientação a mulheres, com ações de conscientização sobre violência, direitos, autoestima e oportunidades. Em 2010, o sonho se fortaleceu com a criação do Instituto e a união de voluntários e apoiadores.</p><p>Hoje, a FAM articula pessoas, profissionais, empresas e parceiros para desenvolver projetos sociais que apoiam mulheres e famílias em diferentes momentos de vulnerabilidade.</p></div>
        </div>
      </section>

      <section className="bg-fam-soft-pink/70 px-5 py-16"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-fam-pink">O que fazemos</p><h2 className="mt-3 font-display text-3xl font-semibold text-fam-plum md:text-4xl">Projetos que aproximam cuidado e oportunidade.</h2></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{projects.map(({ title, text, icon: Icon, tone }) => <article key={title} className="rounded-2xl border border-fam-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></div><h3 className="mt-5 font-display text-xl font-semibold text-fam-plum">{title}</h3><p className="mt-2 text-sm leading-relaxed text-fam-muted">{text}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-6xl px-5 py-16"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[["+14", "anos de atuação"], ["+56", "eventos realizados"], ["+100 mil", "pessoas atendidas"], ["+367", "sonhos realizados"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-fam-gold/45 bg-gradient-to-br from-white to-fam-soft-pink p-6 text-center"><strong className="font-display text-4xl text-fam-purple">{value}</strong><p className="mt-1 text-sm font-semibold text-fam-muted">{label}</p></div>)}</div></section>

      <section className="bg-fam-plum px-5 py-16 text-white"><div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-fam-gold-soft">Juntos somos mais fortes</p><h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-4xl">Faça parte da rede de apoio e transformação da FAM.</h2><p className="mt-4 max-w-2xl text-white/75">Para conhecer nossos projetos, apoiar uma ação ou conversar com a equipe, utilize os canais oficiais do Instituto.</p></div><Button asChild className="w-fit bg-fam-pink text-white hover:bg-fam-rose"><Link href="/fale-conosco">Entre em contato <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>

      <footer className="border-t border-fam-gold/35 bg-fam-night px-5 py-8 text-white"><div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">Instituto FAM — Força Ativa da Mulher</p><p className="mt-1 text-white/65">CNPJ: 13.391.076/0001-37</p></div><div className="flex flex-wrap gap-4 text-white/75"><a href="tel:+5561995042824" className="inline-flex items-center gap-2 hover:text-fam-gold-soft"><Phone className="h-4 w-4" /> (61) 99504-2824</a><a href="mailto:fandf@gmail.com" className="inline-flex items-center gap-2 hover:text-fam-gold-soft"><Mail className="h-4 w-4" /> fandf@gmail.com</a><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Distrito Federal</span><span className="inline-flex items-center gap-2"><Instagram className="h-4 w-4" /> @forcaativafam</span></div></div></footer>
    </main>
  );
}
