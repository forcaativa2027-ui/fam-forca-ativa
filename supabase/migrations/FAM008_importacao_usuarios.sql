-- FAM008 — Fila segura de importação de usuários FAM
-- A tabela não recebe INSERT do navegador; a rota server-side usa a service role.

create table if not exists public.fam_user_imports (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  full_name text not null,
  phone text,
  community_id uuid not null references public.churches(id),
  source text not null default 'importacao_admin',
  consent_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'created', 'already_exists', 'error')),
  auth_user_id uuid,
  attempts integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_fam_user_imports_email
  on public.fam_user_imports(email_normalized);
create index if not exists idx_fam_user_imports_status
  on public.fam_user_imports(status, created_at);

alter table public.fam_user_imports enable row level security;

-- O atendimento e o importador operam via rotas server-side.
drop policy if exists fam_user_imports_no_public_access on public.fam_user_imports;
create policy fam_user_imports_no_public_access
  on public.fam_user_imports for all to anon, authenticated using (false) with check (false);

comment on table public.fam_user_imports is
  'Fila server-side de convites FAM. Não armazena senhas; e-mail e consentimento são auditáveis.';
