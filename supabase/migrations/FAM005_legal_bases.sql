-- FAM005 — Catálogo versionado de Bases Jurídicas (REV-02 RC-02 / JUR-02)
-- Cada operação = purpose_code + data_category + legal_basis + recipient_type + retention_class + versão
-- Sem "base padrão": toda finalidade precisa de config aprovada.

do $$ begin
  create type public.fam_legal_basis_type as enum (
    'consentimento',
    'cumprimento_obrigacao_legal',
    'execucao_politicas_publicas',
    'estudos_por_orgao_pesquisa',
    'execucao_contrato',
    'exercicio_regular_direitos',
    'protecao_vida_incolumidade',
    'tutela_saude',
    'legitimo_interesse',
    'protecao_credito',
    'garantia_prevencao_fraude'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fam_data_category as enum (
    'contato',
    'identificacao',
    'respostas_risco',
    'saude',
    'vida_sexual',
    'crianca_adolescente',
    'pessoa_idosa',
    'pessoa_com_deficiencia',
    'documento',
    'imagem',
    'audio',
    'video',
    'localizacao',
    'outro_sensivel'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fam_retention_class as enum ('R1','R2','R3','R4','R5');
exception when duplicate_object then null; end $$;

create table if not exists public.fam_legal_bases (
  id uuid primary key default gen_random_uuid(),
  code text not null, -- ex: JUR02-ORIENTACAO-V1
  version text not null default '1.0',
  purpose_code text not null, -- ex: orientacao_inicial, protecao_vida, atendimento_saude, encaminhamento
  purpose_description text not null,
  data_category public.fam_data_category not null,
  legal_basis public.fam_legal_basis_type not null,
  legal_basis_description text,
  recipient_type text, -- ex: CRAS, Conselho Tutelar, saude, autoridade_policial, MP, null=sem_compartilhamento
  retention_class public.fam_retention_class not null default 'R1',
  is_active boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code, version),
  unique(purpose_code, data_category, version)
);

create index if not exists idx_fam_legal_bases_purpose on public.fam_legal_bases(purpose_code, data_category, is_active);
create index if not exists idx_fam_legal_bases_legal_basis on public.fam_legal_bases(legal_basis);
create index if not exists idx_fam_legal_bases_retention on public.fam_legal_bases(retention_class);

alter table public.fam_legal_bases enable row level security;

-- Leitura pública autenticada (para exibir aviso contextual antes do envio)
drop policy if exists fam_legal_bases_select on public.fam_legal_bases;
create policy fam_legal_bases_select on public.fam_legal_bases
  for select to authenticated using (true);

-- Escrita apenas para perfis com função governança (apostolo / pastor / jurídico). Simplificado: apenas ativo + approved_by.
-- Produção deve refinar via fam_is_active_attendant() ou role = governance.
drop policy if exists fam_legal_bases_insert on public.fam_legal_bases;
create policy fam_legal_bases_insert on public.fam_legal_bases
  for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
  );

drop policy if exists fam_legal_bases_update on public.fam_legal_bases;
create policy fam_legal_bases_update on public.fam_legal_bases
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));

comment on table public.fam_legal_bases is 'Catálogo versionado de bases jurídicas por finalidade (JUR-02). Sem base padrão; cada operação exige config aprovada (REV-02 RC-02).';
comment on column public.fam_legal_bases.purpose_code is 'Código da finalidade (ex: orientacao_inicial, protecao_vida)';
comment on column public.fam_legal_bases.data_category is 'Categoria do dado (ex: respostas_risco, saude)';
comment on column public.fam_legal_bases.legal_basis is 'Base jurídica LGPD aprovada (JUR-02)';
comment on column public.fam_legal_bases.retention_class is 'Classe de retenção R1..R5 (POL-ARQ-01 / DEC-01)';

-- Auditoria de alterações (trigger)
create or replace function public.fam_legal_bases_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_fam_legal_bases_updated_at on public.fam_legal_bases;
create trigger trg_fam_legal_bases_updated_at
  before update on public.fam_legal_bases
  for each row execute function public.fam_legal_bases_set_updated_at();

-- Seed inicial (exemplos JUR-02, a validar juridicamente antes de produção)
insert into public.fam_legal_bases (code, version, purpose_code, purpose_description, data_category, legal_basis, legal_basis_description, recipient_type, retention_class, is_active) values
-- Orientação inicial (coleta de respostas de risco)
('JUR02-ORIENT-INICIAL-R1', '1.0', 'orientacao_inicial', 'Oferecer orientação inicial e identificar sinais de atenção', 'respostas_risco', 'legitimo_interesse', 'Legítimo interesse - art. 7º, IX LGPD, com teste de proporcionalidade documentado', null, 'R1', true),
('JUR02-ORIENT-SAUDE', '1.0', 'orientacao_inicial', 'Oferecer orientação inicial e identificar sinais de atenção', 'saude', 'consentimento', 'Consentimento específico e destacado - art. 11, I LGPD para dado sensível de saúde', null, 'R1', true),
('JUR02-PROTECAO-VIDA', '1.0', 'protecao_vida_incolumidade', 'Proteção da vida ou incolumidade física diante de perigo atual (AR-01=SIM)', 'respostas_risco', 'protecao_vida_incolumidade', 'Art. 11, II, e LGPD - proteção da vida ou incolumidade física, quando necessário', 'autoridade_policial', 'R1', true),
('JUR02-PROTECAO-VIDA-SAUDE', '1.0', 'protecao_vida_incolumidade', 'Proteção da vida ou incolumidade física', 'saude', 'protecao_vida_incolumidade', 'Art. 11, II, e LGPD', 'servico_saude', 'R2', true),
('JUR02-CRIANCA-PROT', '1.0', 'protecao_crianca_adolescente', 'Proteção de criança/adolescente em risco (AR-05=SIM)', 'crianca_adolescente', 'cumprimento_obrigacao_legal', 'Art. 11, II, a + ECA + Lei 13.431/2017 - cumprimento de obrigação legal', 'conselho_tutelar', 'R3', true),
('JUR02-ENCA-CRAS', '1.0', 'encaminhamento_assistencia', 'Encaminhamento para assistência social', 'contato', 'consentimento', 'Consentimento para compartilhamento mínimo necessário com rede de proteção', 'CRAS', 'R3', true),
('JUR02-ENCA-SAUDE', '1.0', 'encaminhamento_saude', 'Encaminhamento para serviço de saúde (AR-02/AR-16 = SIM)', 'saude', 'tutela_saude', 'Art. 11, II, f - tutela da saúde por profissional/serviço de saúde', 'servico_saude', 'R2', true),
('JUR02-ARQ-DOC', '1.0', 'anexo_documento', 'Anexo opcional de documento para orientação', 'documento', 'consentimento', 'Consentimento específico para finalidade de anexo - art. 11, I', null, 'R2', true)
on conflict (code, version) do nothing;

-- View enxuta para UX (aviso contextual)
create or replace view public.fam_legal_bases_active as
  select code, version, purpose_code, purpose_description, data_category, legal_basis, legal_basis_description, recipient_type, retention_class, effective_at
  from public.fam_legal_bases
  where is_active = true
  order by purpose_code, data_category, version desc;
