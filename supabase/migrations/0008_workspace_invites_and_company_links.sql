-- Invite-only workspace membership and account-to-company linking.

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_invites_token
  ON public.workspace_invites(token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_invites_pending_email
  ON public.workspace_invites(workspace_id, lower(email))
  WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id
  ON public.workspace_invites(workspace_id);

CREATE TABLE IF NOT EXISTS public.company_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_domains_unique
  ON public.company_domains(workspace_id, lower(domain));

ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_company_id
  ON public.workspace_members(company_id);

CREATE OR REPLACE FUNCTION public.resolve_company_for_email(
  p_workspace_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cd.company_id
  FROM public.company_domains cd
  WHERE cd.workspace_id = p_workspace_id
    AND lower(cd.domain) = lower(split_part(COALESCE(p_email, ''), '@', 2))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_company_for_email(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_workspace_member_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = NEW.company_id
        AND c.workspace_id = NEW.workspace_id
    ) THEN
    RAISE EXCEPTION 'company_id must belong to the same workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_workspace_members_validate_company ON public.workspace_members;
CREATE TRIGGER tr_workspace_members_validate_company
  BEFORE INSERT OR UPDATE OF company_id, workspace_id
  ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_workspace_member_company();

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace invites viewable by admins and invitees" ON public.workspace_invites;
CREATE POLICY "Workspace invites viewable by admins and invitees"
  ON public.workspace_invites FOR SELECT
  USING (
    public.is_workspace_admin(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Workspace invites insertable by admins" ON public.workspace_invites;
CREATE POLICY "Workspace invites insertable by admins"
  ON public.workspace_invites FOR INSERT
  WITH CHECK (
    public.is_workspace_admin(workspace_id)
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = company_id
          AND c.workspace_id = workspace_invites.workspace_id
      )
    )
  );

DROP POLICY IF EXISTS "Workspace invites updatable by admins and invitees" ON public.workspace_invites;
CREATE POLICY "Workspace invites updatable by admins and invitees"
  ON public.workspace_invites FOR UPDATE
  USING (
    public.is_workspace_admin(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    public.is_workspace_admin(workspace_id)
    OR (
      lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND accepted_by = auth.uid()
      AND accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Workspace invites deletable by admins" ON public.workspace_invites;
CREATE POLICY "Workspace invites deletable by admins"
  ON public.workspace_invites FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Company domains viewable by workspace members" ON public.company_domains;
CREATE POLICY "Company domains viewable by workspace members"
  ON public.company_domains FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Company domains insertable by admins" ON public.company_domains;
CREATE POLICY "Company domains insertable by admins"
  ON public.company_domains FOR INSERT
  WITH CHECK (
    public.is_workspace_admin(workspace_id)
    AND EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = company_id
        AND c.workspace_id = company_domains.workspace_id
    )
  );

DROP POLICY IF EXISTS "Company domains updatable by admins" ON public.company_domains;
CREATE POLICY "Company domains updatable by admins"
  ON public.company_domains FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (
    public.is_workspace_admin(workspace_id)
    AND EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = company_id
        AND c.workspace_id = company_domains.workspace_id
    )
  );

DROP POLICY IF EXISTS "Company domains deletable by admins" ON public.company_domains;
CREATE POLICY "Company domains deletable by admins"
  ON public.company_domains FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Workspace members insertable by accepted invite" ON public.workspace_members;
CREATE POLICY "Workspace members insertable by accepted invite"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.workspace_invites inv
      WHERE inv.workspace_id = workspace_members.workspace_id
        AND lower(inv.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND inv.accepted_at IS NULL
        AND (
          inv.expires_at IS NULL
          OR inv.expires_at > NOW()
        )
        AND (
          inv.company_id IS NULL
          OR workspace_members.company_id IS NULL
          OR workspace_members.company_id = inv.company_id
        )
    )
  );

DROP POLICY IF EXISTS "Workspace members updatable by admins" ON public.workspace_members;
CREATE POLICY "Workspace members updatable by admins"
  ON public.workspace_members FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (
    public.is_workspace_admin(workspace_id)
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = company_id
          AND c.workspace_id = workspace_members.workspace_id
      )
    )
  );
