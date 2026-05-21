-- Fix infinite recursion in workspace_members RLS policies.
-- Run this in Supabase SQL Editor if you already applied 0002_rls_policies.sql.

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO authenticated;

-- Workspaces
DROP POLICY IF EXISTS "Workspaces viewable by members" ON public.workspaces;
CREATE POLICY "Workspaces viewable by members"
  ON public.workspaces FOR SELECT
  USING (
    public.is_workspace_member(id)
    OR created_by = auth.uid()
  );

-- Workspace members
DROP POLICY IF EXISTS "Workspace members viewable by members" ON public.workspace_members;
CREATE POLICY "Workspace members viewable by members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace members insertable by admins" ON public.workspace_members;
CREATE POLICY "Workspace members insertable by admins"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Workspace members insertable by workspace creator" ON public.workspace_members;
CREATE POLICY "Workspace members insertable by workspace creator"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members deletable by admins" ON public.workspace_members;
CREATE POLICY "Workspace members deletable by admins"
  ON public.workspace_members FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- Categories
DROP POLICY IF EXISTS "Categories viewable by workspace members" ON public.categories;
CREATE POLICY "Categories viewable by workspace members"
  ON public.categories FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Categories insertable by admins" ON public.categories;
CREATE POLICY "Categories insertable by admins"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Categories updatable by admins" ON public.categories;
CREATE POLICY "Categories updatable by admins"
  ON public.categories FOR UPDATE
  USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "Categories deletable by admins" ON public.categories;
CREATE POLICY "Categories deletable by admins"
  ON public.categories FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- Items
DROP POLICY IF EXISTS "Items viewable by workspace members" ON public.items;
CREATE POLICY "Items viewable by workspace members"
  ON public.items FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Items insertable by workspace members" ON public.items;
CREATE POLICY "Items insertable by workspace members"
  ON public.items FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Items updatable by workspace members" ON public.items;
CREATE POLICY "Items updatable by workspace members"
  ON public.items FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Items deletable by admins" ON public.items;
CREATE POLICY "Items deletable by admins"
  ON public.items FOR DELETE
  USING (public.is_workspace_admin(workspace_id));

-- Comments
DROP POLICY IF EXISTS "Comments viewable by workspace members" ON public.comments;
CREATE POLICY "Comments viewable by workspace members"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = comments.item_id
        AND public.is_workspace_member(i.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Comments insertable by workspace members" ON public.comments;
CREATE POLICY "Comments insertable by workspace members"
  ON public.comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = comments.item_id
        AND public.is_workspace_member(i.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Comments deletable by author or admin" ON public.comments;
CREATE POLICY "Comments deletable by author or admin"
  ON public.comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = comments.item_id
        AND public.is_workspace_admin(i.workspace_id)
    )
  );

-- Activity log
DROP POLICY IF EXISTS "Activity log viewable by workspace members" ON public.activity_log;
CREATE POLICY "Activity log viewable by workspace members"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = activity_log.item_id
        AND public.is_workspace_member(i.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Activity log insertable by workspace members" ON public.activity_log;
CREATE POLICY "Activity log insertable by workspace members"
  ON public.activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.items i
      WHERE i.id = activity_log.item_id
        AND public.is_workspace_member(i.workspace_id)
    )
  );
