-- FAM024 — AC-02 / POL-ARQ-01
-- Credenciamento profissional e decisão de acesso por finalidade.
-- Não remove nem altera dados legados.

DO $$ BEGIN
  CREATE TYPE public.fam_credential_status AS ENUM ('requested','under_review','active','suspended','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.fam_professional_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key text NOT NULL DEFAULT 'FAM' CHECK (tenant_key = 'FAM'),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_role text NOT NULL,
  qualification text NOT NULL DEFAULT '',
  purpose text NOT NULL,
  scope_type text NOT NULL DEFAULT 'case' CHECK (scope_type IN ('case','regional','all_fam')),
  scope_id uuid,
  allowed_purposes text[] NOT NULL DEFAULT ARRAY[]::text[],
  status public.fam_credential_status NOT NULL DEFAULT 'requested',
  valid_from timestamptz,
  valid_until timestamptz,
  mfa_required boolean NOT NULL DEFAULT true,
  mfa_verified_at timestamptz,
  requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  reviewed_at timestamptz,
  review_notes text,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  CHECK (status <> 'active' OR approved_by IS NOT NULL),
  CHECK (status <> 'active' OR valid_from IS NOT NULL),
);

CREATE INDEX IF NOT EXISTS idx_fam_credentials_profile ON public.fam_professional_credentials(profile_id);
CREATE INDEX IF NOT EXISTS idx_fam_credentials_status ON public.fam_professional_credentials(status);
CREATE INDEX IF NOT EXISTS idx_fam_credentials_tenant_status ON public.fam_professional_credentials(tenant_key, status);

CREATE TABLE IF NOT EXISTS public.fam_access_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key text NOT NULL DEFAULT 'FAM' CHECK (tenant_key = 'FAM'),
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  credential_id uuid REFERENCES public.fam_professional_credentials(id) ON DELETE SET NULL,
  case_id uuid,
  purpose text NOT NULL,
  action text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('ALLOW','DENY','REQUIRE_APPROVAL','REQUIRE_MFA')),
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fam_access_audit_created ON public.fam_access_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fam_access_audit_subject ON public.fam_access_audit_events(subject_profile_id);

CREATE OR REPLACE FUNCTION public.fam_touch_professional_credential()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fam_professional_credential_touch ON public.fam_professional_credentials;
CREATE TRIGGER trg_fam_professional_credential_touch
BEFORE UPDATE ON public.fam_professional_credentials
FOR EACH ROW EXECUTE FUNCTION public.fam_touch_professional_credential();

CREATE OR REPLACE FUNCTION public.fam_is_credential_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role::text = 'apostolo'
  ) OR EXISTS (
    SELECT 1 FROM public.module_delegations d
    WHERE d.profile_id = auth.uid()
      AND d.module::text IN ('administrativo','usuarios')
      AND d.status::text = 'ativo'
      AND (d.expires_at IS NULL OR d.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.fam_can_access_sensitive_content(
  p_profile_id uuid,
  p_case_id uuid,
  p_purpose text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c record;
  allowed boolean;
BEGIN
  IF p_profile_id IS NULL OR auth.uid() IS DISTINCT FROM p_profile_id THEN
    RETURN false;
  END IF;

  IF coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    INSERT INTO public.fam_access_audit_events(actor_user_id, subject_profile_id, case_id, purpose, action, decision, reason)
    VALUES (auth.uid(), p_profile_id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'REQUIRE_MFA', 'Sessão sem assurance level aal2');
    RETURN false;
  END IF;

  SELECT * INTO c
  FROM public.fam_professional_credentials
  WHERE tenant_key = 'FAM'
    AND profile_id = p_profile_id
    AND status = 'active'
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.fam_access_audit_events(actor_user_id, subject_profile_id, case_id, purpose, action, decision, reason)
    VALUES (auth.uid(), p_profile_id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'DENY', 'Nenhum credenciamento profissional ativo');
    RETURN false;
  END IF;

  IF c.mfa_required AND c.mfa_verified_at IS NULL THEN
    INSERT INTO public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
    VALUES (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'REQUIRE_MFA', 'MFA do credenciamento não confirmado');
    RETURN false;
  END IF;

  allowed := cardinality(c.allowed_purposes) = 0 OR p_purpose = ANY(c.allowed_purposes);
  IF NOT allowed THEN
    INSERT INTO public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
    VALUES (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'DENY', 'Finalidade fora do escopo');
    RETURN false;
  END IF;

  INSERT INTO public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
  VALUES (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'ALLOW', 'Credenciamento, finalidade e validade compatíveis');
  RETURN true;
END;
$$;

ALTER TABLE public.fam_professional_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fam_access_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fam_credentials_self_read ON public.fam_professional_credentials;
CREATE POLICY fam_credentials_self_read ON public.fam_professional_credentials
FOR SELECT TO authenticated
USING (tenant_key = 'FAM' AND (profile_id = auth.uid() OR public.fam_is_credential_manager()));

DROP POLICY IF EXISTS fam_credentials_manager_write ON public.fam_professional_credentials;
CREATE POLICY fam_credentials_manager_write ON public.fam_professional_credentials
FOR ALL TO authenticated
USING (tenant_key = 'FAM' AND public.fam_is_credential_manager())
WITH CHECK (tenant_key = 'FAM' AND public.fam_is_credential_manager());

DROP POLICY IF EXISTS fam_credentials_self_request ON public.fam_professional_credentials;
CREATE POLICY fam_credentials_self_request ON public.fam_professional_credentials
FOR INSERT TO authenticated
WITH CHECK (tenant_key = 'FAM' AND profile_id = auth.uid() AND status = 'requested');

DROP POLICY IF EXISTS fam_access_audit_manager_read ON public.fam_access_audit_events;
CREATE POLICY fam_access_audit_manager_read ON public.fam_access_audit_events
FOR SELECT TO authenticated
USING (tenant_key = 'FAM' AND (actor_user_id = auth.uid() OR public.fam_is_credential_manager()));

GRANT SELECT, INSERT, UPDATE ON public.fam_professional_credentials TO authenticated;
GRANT SELECT ON public.fam_access_audit_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.fam_is_credential_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fam_can_access_sensitive_content(uuid, uuid, text) TO authenticated;

COMMENT ON TABLE public.fam_professional_credentials IS 'AC-02: credenciamento individual por finalidade, escopo, validade e MFA; cargo isolado não concede acesso.';
COMMENT ON FUNCTION public.fam_can_access_sensitive_content(uuid, uuid, text) IS 'POL-ARQ-01: decisão de acesso sensível com finalidade, validade, MFA e auditoria.';

-- Homologação: confirmar que a tabela foi criada e que nenhum dado legado foi removido.
SELECT 'FAM024 installed' AS migration, count(*) AS credentials FROM public.fam_professional_credentials;

-- Nota: não inserir credenciais activas automaticamente. A activação depende de aprovação institucional.

-- Fim FAM024


-- Confirma o MFA da sessão para credenciais activas do próprio usuário.
-- A função não aceita profile_id externo e não permite auto-activação da credencial.
CREATE OR REPLACE FUNCTION public.fam_confirm_credential_mfa()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF auth.uid() IS NULL OR coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'MFA_REQUIRED';
  END IF;

  UPDATE public.fam_professional_credentials
  SET mfa_verified_at = now(), updated_at = now()
  WHERE tenant_key = 'FAM'
    AND profile_id = auth.uid()
    AND status = 'active'
    AND mfa_required = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now());

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fam_confirm_credential_mfa() TO authenticated;

COMMENT ON FUNCTION public.fam_confirm_credential_mfa() IS
  'AC-02/POL-ARQ-01: registra a verificação MFA aal2 apenas na credencial activa do próprio usuário.';
