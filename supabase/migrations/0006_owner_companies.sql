-- Workspace-scoped owner companies with workspace defaults.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_companies_workspace_id
  ON public.companies(workspace_id);

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS default_owner_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS owner_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_default_owner_company_id
  ON public.workspaces(default_owner_company_id);

CREATE INDEX IF NOT EXISTS idx_items_owner_company_id
  ON public.items(owner_company_id);

CREATE OR REPLACE FUNCTION public.validate_workspace_default_owner_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.default_owner_company_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = NEW.default_owner_company_id
        AND c.workspace_id = NEW.id
    ) THEN
    RAISE EXCEPTION 'default_owner_company_id must belong to the same workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_workspaces_validate_default_owner_company ON public.workspaces;
CREATE TRIGGER tr_workspaces_validate_default_owner_company
  BEFORE INSERT OR UPDATE OF default_owner_company_id
  ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_workspace_default_owner_company();

CREATE OR REPLACE FUNCTION public.validate_item_owner_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_company_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = NEW.owner_company_id
        AND c.workspace_id = NEW.workspace_id
    ) THEN
    RAISE EXCEPTION 'owner_company_id must belong to the same workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_items_validate_owner_company ON public.items;
CREATE TRIGGER tr_items_validate_owner_company
  BEFORE INSERT OR UPDATE OF owner_company_id, workspace_id
  ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_item_owner_company();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies viewable by workspace members" ON public.companies;
CREATE POLICY "Companies viewable by workspace members"
  ON public.companies FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Companies insertable by admins" ON public.companies;
CREATE POLICY "Companies insertable by admins"
  ON public.companies FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Companies updatable by admins" ON public.companies;
CREATE POLICY "Companies updatable by admins"
  ON public.companies FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Companies deletable by admins" ON public.companies;
CREATE POLICY "Companies deletable by admins"
  ON public.companies FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Workspaces updatable by admins" ON public.workspaces;
CREATE POLICY "Workspaces updatable by admins"
  ON public.workspaces FOR UPDATE
  USING (public.is_workspace_admin(id))
  WITH CHECK (
    public.is_workspace_admin(id)
    AND (
      default_owner_company_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = default_owner_company_id
          AND c.workspace_id = id
      )
    )
  );

DROP POLICY IF EXISTS "Items insertable by workspace members" ON public.items;
CREATE POLICY "Items insertable by workspace members"
  ON public.items FOR INSERT
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    AND created_by = auth.uid()
    AND (
      owner_company_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = owner_company_id
          AND c.workspace_id = items.workspace_id
      )
    )
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories cat
        WHERE cat.id = category_id
          AND cat.workspace_id = items.workspace_id
      )
    )
    AND (
      assignee_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = items.workspace_id
          AND wm.user_id = assignee_id
      )
    )
  );

DROP POLICY IF EXISTS "Items updatable by workspace members" ON public.items;
CREATE POLICY "Items updatable by workspace members"
  ON public.items FOR UPDATE
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    AND (
      owner_company_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = owner_company_id
          AND c.workspace_id = items.workspace_id
      )
    )
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories cat
        WHERE cat.id = category_id
          AND cat.workspace_id = items.workspace_id
      )
    )
    AND (
      assignee_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = items.workspace_id
          AND wm.user_id = assignee_id
      )
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
  END IF;
END;
$$;
