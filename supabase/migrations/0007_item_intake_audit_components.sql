-- Item intake metadata, components taxonomy, and richer activity types.

CREATE TABLE IF NOT EXISTS public.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_components_workspace_id
  ON public.components(workspace_id);

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES public.components(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reporter_name TEXT,
  ADD COLUMN IF NOT EXISTS reporter_email TEXT,
  ADD COLUMN IF NOT EXISTS reporter_source TEXT;

CREATE INDEX IF NOT EXISTS idx_items_component_id
  ON public.items(component_id);

CREATE OR REPLACE FUNCTION public.validate_item_component()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.component_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.components cp
      WHERE cp.id = NEW.component_id
        AND cp.workspace_id = NEW.workspace_id
    ) THEN
    RAISE EXCEPTION 'component_id must belong to the same workspace';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_items_validate_component ON public.items;
CREATE TRIGGER tr_items_validate_component
  BEFORE INSERT OR UPDATE OF component_id, workspace_id
  ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_item_component();

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Components viewable by workspace members" ON public.components;
CREATE POLICY "Components viewable by workspace members"
  ON public.components FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Components insertable by admins" ON public.components;
CREATE POLICY "Components insertable by admins"
  ON public.components FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Components updatable by admins" ON public.components;
CREATE POLICY "Components updatable by admins"
  ON public.components FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Components deletable by admins" ON public.components;
CREATE POLICY "Components deletable by admins"
  ON public.components FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

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
      component_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.components cp
        WHERE cp.id = component_id
          AND cp.workspace_id = items.workspace_id
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
      component_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.components cp
        WHERE cp.id = component_id
          AND cp.workspace_id = items.workspace_id
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

ALTER TABLE public.activity_log
  DROP CONSTRAINT IF EXISTS activity_log_action_type_check;

ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_action_type_check
  CHECK (
    action_type IN (
      'created',
      'status_change',
      'category_change',
      'assignee_change',
      'title_change',
      'description_change',
      'owner_company_change',
      'reporter_update',
      'component_change'
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
      AND tablename = 'components'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.components;
  END IF;
END;
$$;
