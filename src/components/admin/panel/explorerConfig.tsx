import type { ReactNode } from "react";
import type { TabKey } from "../AdminSidebar";
import {
  LayoutDashboard, BarChart2, ClipboardList, CalendarRange, Bell, BarChart3,
  RadioTower, Brain, Target,
  Building2, GitBranch, Network, Mic2, Baby, Flame, Megaphone, Heart, Map, Users,
  CalendarDays, FileBarChart, Clock,
  Library, FolderTree, Image, Radio, ScreenShare, Video, HandCoins, BookOpen,
  Sparkles, GraduationCap, Compass, Link2,
  DollarSign, Landmark, UserCog, IdCard, Activity, UserCog2, Shield, Tags, Gavel,
  Star, Cake, TrendingDown, Briefcase, Search, Download, MonitorSmartphone, FolderOpen,
} from "lucide-react";

export interface ExplorerItem {
  key: TabKey;
  label: string;
  icon: ReactNode;
  description: string;
  children?: ExplorerItem[];
}

export const EXPLORER_MAP: Record<string, ExplorerItem[]> = {
  dashboard: [
    { key: "org-dashboard", label: "Visão geral", icon: <BarChart2 size={16} />, description: "Panorama da igreja com os principais indicadores e atalhos." },
    { key: "pendencias", label: "Pendências", icon: <ClipboardList size={16} />, description: "Tarefas e aprovações que precisam da sua atenção." },
    { key: "agenda", label: "Agenda", icon: <CalendarRange size={16} />, description: "Compromissos, cultos e reuniões programadas." },
    { key: "notificacoes", label: "Notificações", icon: <Bell size={16} />, description: "Central de avisos e alertas do painel." },
    { key: "relmda-dashboard", label: "M.D.A. — Visão Geral", icon: <BarChart3 size={16} />, description: "Acompanhamento ministerial consolidado." },
    { key: "supervision", label: "Supervisão", icon: <BarChart3 size={16} />, description: "Visão de supervisão e acompanhamento de áreas." },
  ],
  estrategico: [
    { key: "control-tower", label: "Torre de Controle", icon: <RadioTower size={16} />, description: "Central de alertas e tomada de decisão estratégica." },
    { key: "intelligence", label: "Inteligência Ministerial", icon: <Brain size={16} />, description: "Análises e insights sobre o crescimento da igreja." },
    { key: "ministerial-reports", label: "Relatórios Estratégicos", icon: <BarChart3 size={16} />, description: "Relatórios consolidados para a liderança." },
    { key: "metas", label: "Metas e Indicadores", icon: <Target size={16} />, description: "Acompanhamento de metas da organização." },
  ],
  organizacao: [
    { key: "communities", label: "Comunidades", icon: <Building2 size={16} />, description: "Gestão das comunidades e núcleos." },
    { key: "structure", label: "Estrutura Organizacional", icon: <GitBranch size={16} />, description: "Hierarquia e organização da igreja." },
    { key: "genealogy", label: "Genealogia", icon: <Network size={16} />, description: "Histórico e relacionamentos familiares." },
    { key: "ministerios", label: "Ministérios", icon: <Mic2 size={16} />, description: "Ministérios e suas equipes." },
    { key: "kids-admin", label: "Ministério de Crianças (KIDS)", icon: <Baby size={16} />, description: "Gestão do ministério infantil." },
    { key: "life-groups", label: "Life Groups", icon: <Flame size={16} />, description: "Células e grupos de vida." },
    { key: "evangelism-groups", label: "Grupos de Evangelismo", icon: <Megaphone size={16} />, description: "Grupos focados em evangelismo." },
    { key: "expansion-map", label: "Mapa de Expansão", icon: <Map size={16} />, description: "Acompanhe a expansão territorial." },
    {
      key: "mda", label: "M.D.A. e Saúde", icon: <Users size={16} />, description: "Estrutura MDA, saúde e acompanhamento ministerial.",
      children: [
        { key: "mda", label: "Estrutura MDA", icon: <Network size={16} />, description: "Estrutura do Ministério de Áreas (MDA)." },
        { key: "mda-health", label: "Saúde MDA", icon: <Heart size={16} />, description: "Saúde e bem-estar das lideranças MDA." },
        { key: "saude", label: "Saúde e Acompanhamento", icon: <Heart size={16} />, description: "Saúde e acompanhamento dos membros." },
      ],
    },
  ],
  relatorios: [
    {
      key: "weekly", label: "Life Groups", icon: <CalendarDays size={16} />, description: "Relatórios dos grupos de vida.",
      children: [
        { key: "weekly", label: "Life Groups — Semanal", icon: <CalendarDays size={16} />, description: "Relatório semanal dos grupos." },
        { key: "monthly", label: "Life Groups — Mensal", icon: <CalendarRange size={16} />, description: "Relatório mensal dos grupos." },
      ],
    },
    {
      key: "relmda-supervisao", label: "M.D.A.", icon: <FileBarChart size={16} />, description: "Relatórios do Ministério de Áreas.",
      children: [
        { key: "relmda-supervisao", label: "M.D.A. — Supervisão", icon: <FileBarChart size={16} />, description: "Consolidado por supervisor." },
        { key: "relmda-consolidacao", label: "M.D.A. — Consolidação", icon: <Network size={16} />, description: "Consolidação de dados MDA." },
        { key: "relmda-dashboard", label: "M.D.A. — Visão Geral", icon: <BarChart3 size={16} />, description: "Painel geral do MDA." },
        { key: "relmda-prazos", label: "M.D.A. — Prazos", icon: <Clock size={16} />, description: "Prazos e vencimentos do MDA." },
        { key: "relmda-area", label: "M.D.A. — Consolidado por Área", icon: <FileBarChart size={16} />, description: "Consolidado por área ministerial." },
      ],
    },
  ],
  conteudo: [
    { key: "editorial-dashboard", label: "Dashboard Editorial", icon: <LayoutDashboard size={16} />, description: "Visão geral do conteúdo publicado." },
    { key: "content-library", label: "Biblioteca de Arquivos", icon: <Library size={16} />, description: "Arquivos e mídias da igreja." },
    { key: "categories-tags", label: "Categorias e Tags", icon: <FolderTree size={16} />, description: "Organize categorias e etiquetas." },
    {
      key: "news", label: "Produção de Conteúdo", icon: <Megaphone size={16} />, description: "Notícias, banners, mídias e canais.",
      children: [
        { key: "news", label: "Notícias", icon: <Megaphone size={16} />, description: "Publique notícias da igreja." },
        { key: "banners", label: "Banners", icon: <Image size={16} />, description: "Banners e destaques do site." },
        { key: "sermons", label: "Pregações", icon: <Mic2 size={16} />, description: "Mensagens e pregações." },
        { key: "news-videos", label: "CEC News Vídeos", icon: <Video size={16} />, description: "Vídeos do CEC News." },
        { key: "services", label: "Cultos", icon: <Radio size={16} />, description: "Programação de cultos." },
        { key: "word", label: "Palavra do dia", icon: <BookOpen size={16} />, description: "Mensagem diária." },
      ],
    },
    {
      key: "radio", label: "Canais ao Vivo", icon: <Radio size={16} />, description: "Rádio Web e projeção ao vivo.",
      children: [
        { key: "radio", label: "Rádio Web", icon: <Radio size={16} />, description: "Gestão da rádio e programação." },
        { key: "live360", label: "Live-360", icon: <ScreenShare size={16} />, description: "Projeção ao vivo no datashow." },
        { key: "giving", label: "Momento da Generosidade", icon: <HandCoins size={16} />, description: "Ofertas e generosidade." },
      ],
    },
    {
      key: "events", label: "Programação", icon: <CalendarDays size={16} />, description: "Agenda e eventos.",
      children: [
        { key: "events", label: "Agenda", icon: <CalendarDays size={16} />, description: "Agenda de eventos e cultos." },
        { key: "registration-events", label: "Eventos", icon: <ClipboardList size={16} />, description: "Inscrições e gestão de eventos." },
      ],
    },
  ],
  cecmais: [
    { key: "cecmais-ofertas", label: "Ofertas", icon: <Sparkles size={16} />, description: "Plataforma de ofertas e doações." },
  ],
  academy: [
    { key: "formacao", label: "Escolas e Cursos", icon: <GraduationCap size={16} />, description: "Escolas e trilhas de formação." },
    { key: "conhecimento-biblico", label: "Exploração Bíblica", icon: <Compass size={16} />, description: "Pontos de conhecimento bíblico." },
    { key: "biblioteca-conhecimento", label: "Biblioteca (Conhecimento Integrado)", icon: <Library size={16} />, description: "Biblioteca de conhecimento integrado." },
    { key: "biblia-referencias", label: "Bíblia — Referências Cruzadas", icon: <Link2 size={16} />, description: "Referências cruzadas da Bíblia." },
  ],
  recursos: [
    { key: "finance", label: "Financeiro", icon: <DollarSign size={16} />, description: "Gestão financeira da igreja." },
    { key: "patrimony", label: "Patrimônio", icon: <Landmark size={16} />, description: "Bens e patrimônio institucional." },
    { key: "gpv", label: "Recursos Humanos", icon: <UserCog size={16} />, description: "Gestão de pessoas e voluntários." },
  ],
  "cec-id": [
    { key: "cec-id-portaria", label: "Leitor de Portaria", icon: <IdCard size={16} />, description: "Leitura e validação do CEC ID." },
  ],
  usuarios: [
    { key: "usuarios-painel", label: "Painel de Usuários", icon: <Activity size={16} />, description: "Visão geral dos usuários do sistema." },
    { key: "members", label: "Membros", icon: <Users size={16} />, description: "Gestão de membros e cadastros." },
    { key: "leadership", label: "Liderança / Níveis", icon: <UserCog2 size={16} />, description: "Níveis de liderança e funções." },
    { key: "invites", label: "Convites", icon: <Link2 size={16} />, description: "Convites de acesso ao painel." },
    { key: "permissions", label: "Permissões", icon: <Shield size={16} />, description: "Permissões atômicas e de módulo." },
    { key: "org-terminology", label: "Terminologia Organizacional", icon: <Tags size={16} />, description: "Termos usados na organização." },
    { key: "delegations", label: "Delegações", icon: <Gavel size={16} />, description: "Delegue módulos e abas a outros usuários." },
    { key: "score", label: "Score", icon: <Star size={16} />, description: "Pontuação e engajamento dos membros." },
    { key: "birthdays", label: "Aniversários", icon: <Cake size={16} />, description: "Aniversariantes e celebrações." },
    {
      key: "discipleship", label: "Cuidado e Acompanhamento", icon: <Heart size={16} />, description: "Discipulado, acolhimento e acompanhamento.",
      children: [
        { key: "discipleship", label: "Discipulado", icon: <BookOpen size={16} />, description: "Trilhas e vínculos de discipulado." },
        { key: "acolhimento", label: "Acolhimento", icon: <Heart size={16} />, description: "Acolhimento de novos membros." },
        { key: "evasao", label: "Pessoas em Risco", icon: <TrendingDown size={16} />, description: "Acompanhamento de pessoas em risco." },
        { key: "crm", label: "CRM", icon: <Briefcase size={16} />, description: "Gestão do relacionamento com membros." },
        { key: "prayer-requests", label: "Pedidos de oração", icon: <Bell size={16} />, description: "Pedidos de oração da igreja." },
        { key: "visit-requests", label: "Visitas", icon: <CalendarDays size={16} />, description: "Visitas e acompanhamento." },
      ],
    },
  ],
  auditoria: [
    { key: "audit", label: "Registros de Auditoria", icon: <ClipboardList size={16} />, description: "Logs e trilha de auditoria do sistema." },
  ],
  ferramentas: [
    { key: "export", label: "Exportar Dados", icon: <Download size={16} />, description: "Exportação de dados do painel." },
    { key: "pesquisa-avancada", label: "Pesquisa Avançada", icon: <Search size={16} />, description: "Busca corporativa avançada." },
  ],
};

export const EXPLORER_GROUP_ICONS: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={16} />,
  estrategico: <RadioTower size={16} />,
  organizacao: <Building2 size={16} />,
  relatorios: <FileBarChart size={16} />,
  conteudo: <Megaphone size={16} />,
  cecmais: <Sparkles size={16} />,
  academy: <GraduationCap size={16} />,
  recursos: <DollarSign size={16} />,
  "cec-id": <IdCard size={16} />,
  usuarios: <UserCog2 size={16} />,
  auditoria: <Shield size={16} />,
  ferramentas: <FolderOpen size={16} />,
};

export const EXPLORER_GROUP_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  estrategico: "Gestão Estratégica",
  organizacao: "Organização Institucional",
  relatorios: "Relatórios Operacionais",
  conteudo: "Central de Conteúdo",
  cecmais: "CECmais",
  academy: "CEC Academy",
  recursos: "Gestão de Recursos",
  "cec-id": "CEC ID",
  usuarios: "Administração de Usuários",
  auditoria: "Auditoria e Segurança",
  ferramentas: "Ferramentas",
};

export { MonitorSmartphone };