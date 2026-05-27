-- Workspace-scoped custom statuses for items.

CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_statuses_workspace_id
  ON public.statuses(workspace_id);

ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Statuses viewable by workspace members" ON public.statuses;
CREATE POLICY "Statuses viewable by workspace members"
  ON public.statuses FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Statuses insertable by admins" ON public.statuses;
CREATE POLICY "Statuses insertable by admins"
  ON public.statuses FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Statuses updatable by admins" ON public.statuses;
CREATE POLICY "Statuses updatable by admins"
  ON public.statuses FOR UPDATE
  USING (public.is_workspace_admin(workspace_id))
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Statuses deletable by admins" ON public.statuses;
CREATE POLICY "Statuses deletable by admins"
  ON public.statuses FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_status_check;

CREATE OR REPLACE FUNCTION public.validate_item_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.statuses s
    WHERE s.workspace_id = NEW.workspace_id
      AND s.name = NEW.status
  ) THEN
    RAISE EXCEPTION 'status must belong to the same workspace';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_items_validate_status ON public.items;
CREATE TRIGGER tr_items_validate_status
  BEFORE INSERT OR UPDATE OF status, workspace_id
  ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_item_status();

INSERT INTO public.statuses (workspace_id, name, sort_order)
SELECT
  w.id AS workspace_id,
  defaults.name,
  defaults.sort_order
FROM public.workspaces w
CROSS JOIN (
  SELECT *
  FROM unnest(
    ARRAY[
      'New',
      'Acknowledged',
      'In progress',
      'Blocked',
      'Fixed',
      'Verified',
      'Closed'
    ]::TEXT[]
  ) WITH ORDINALITY AS t(name, sort_order)
) AS defaults
ON CONFLICT (workspace_id, name) DO NOTHING;

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
      AND tablename = 'statuses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;
  END IF;
END;
$$;
