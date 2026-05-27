-- Support multi-select menu components and owner companies per item.

CREATE TABLE IF NOT EXISTS public.item_component_links (
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, component_id)
);

CREATE TABLE IF NOT EXISTS public.item_owner_company_links (
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_item_component_links_workspace_id
  ON public.item_component_links(workspace_id);

CREATE INDEX IF NOT EXISTS idx_item_component_links_component_id
  ON public.item_component_links(component_id);

CREATE INDEX IF NOT EXISTS idx_item_owner_company_links_workspace_id
  ON public.item_owner_company_links(workspace_id);

CREATE INDEX IF NOT EXISTS idx_item_owner_company_links_company_id
  ON public.item_owner_company_links(company_id);

CREATE OR REPLACE FUNCTION public.validate_item_component_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.items i
    JOIN public.components cp ON cp.id = NEW.component_id
    WHERE i.id = NEW.item_id
      AND i.workspace_id = NEW.workspace_id
      AND cp.workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'item_id and component_id must belong to the same workspace';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_item_owner_company_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.items i
    JOIN public.companies c ON c.id = NEW.company_id
    WHERE i.id = NEW.item_id
      AND i.workspace_id = NEW.workspace_id
      AND c.workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'item_id and company_id must belong to the same workspace';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_item_component_link ON public.item_component_links;
CREATE TRIGGER tr_validate_item_component_link
  BEFORE INSERT OR UPDATE OF item_id, workspace_id, component_id
  ON public.item_component_links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_item_component_link();

DROP TRIGGER IF EXISTS tr_validate_item_owner_company_link ON public.item_owner_company_links;
CREATE TRIGGER tr_validate_item_owner_company_link
  BEFORE INSERT OR UPDATE OF item_id, workspace_id, company_id
  ON public.item_owner_company_links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_item_owner_company_link();

ALTER TABLE public.item_component_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_owner_company_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Item component links viewable by workspace members" ON public.item_component_links;
CREATE POLICY "Item component links viewable by workspace members"
  ON public.item_component_links FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item component links insertable by workspace members" ON public.item_component_links;
CREATE POLICY "Item component links insertable by workspace members"
  ON public.item_component_links FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item component links updatable by workspace members" ON public.item_component_links;
CREATE POLICY "Item component links updatable by workspace members"
  ON public.item_component_links FOR UPDATE
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item component links deletable by workspace members" ON public.item_component_links;
CREATE POLICY "Item component links deletable by workspace members"
  ON public.item_component_links FOR DELETE
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item owner links viewable by workspace members" ON public.item_owner_company_links;
CREATE POLICY "Item owner links viewable by workspace members"
  ON public.item_owner_company_links FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item owner links insertable by workspace members" ON public.item_owner_company_links;
CREATE POLICY "Item owner links insertable by workspace members"
  ON public.item_owner_company_links FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item owner links updatable by workspace members" ON public.item_owner_company_links;
CREATE POLICY "Item owner links updatable by workspace members"
  ON public.item_owner_company_links FOR UPDATE
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Item owner links deletable by workspace members" ON public.item_owner_company_links;
CREATE POLICY "Item owner links deletable by workspace members"
  ON public.item_owner_company_links FOR DELETE
  USING (public.is_workspace_member(workspace_id));

INSERT INTO public.item_component_links (item_id, workspace_id, component_id)
SELECT i.id, i.workspace_id, i.component_id
FROM public.items i
WHERE i.component_id IS NOT NULL
ON CONFLICT (item_id, component_id) DO NOTHING;

INSERT INTO public.item_owner_company_links (item_id, workspace_id, company_id)
SELECT i.id, i.workspace_id, i.owner_company_id
FROM public.items i
WHERE i.owner_company_id IS NOT NULL
ON CONFLICT (item_id, company_id) DO NOTHING;

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
      AND tablename = 'item_component_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.item_component_links;
  END IF;
END;
$$;

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
      AND tablename = 'item_owner_company_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.item_owner_company_links;
  END IF;
END;
$$;
