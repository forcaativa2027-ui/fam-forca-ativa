-- FAM004: solicitações explícitas de encaminhamento.
-- Não concede acesso ao banco FAM nem envia dados automaticamente.

create table if not exists public.fam_referral_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  recipient text not null,
  purpose text not null,
  priority text not null,
  reason_code text not null,
  requested_data jsonb not null default '[]'::jsonb,
  selected_attachment_ids jsonb not null default '[]'::jsonb,
  status text not null default 'requested' check (status in ('requested', 'under_review', 'sent', 'received', 'cancelled')),
  explicit_confirmation_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fam_referral_requests_case on public.fam_referral_requests(case_id, created_at);
create index if not exists idx_fam_referral_requests_status on public.fam_referral_requests(status, created_at);

alter table public.fam_referral_requests enable row level security;

drop policy if exists fam_referral_requests_owner_select on public.fam_referral_requests;
create policy fam_referral_requests_owner_select on public.fam_referral_requests for select to authenticated
  using (requested_by = auth.uid());

drop policy if exists fam_referral_requests_owner_insert on public.fam_referral_requests;
create policy fam_referral_requests_owner_insert on public.fam_referral_requests for insert to authenticated
  with check (
    requested_by = auth.uid()
    and exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid())
    and explicit_confirmation_at is not null
  );

comment on table public.fam_referral_requests is 'Pedido explícito de encaminhamento; não representa envio, recebimento ou garantia de atendimento.';
comment on column public.fam_referral_requests.requested_data is 'Escopo mínimo informado à usuária; não armazenar histórico completo por padrão.';
