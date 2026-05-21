-- Fix workspace creation: allow creators to read their workspace
-- before they are added to workspace_members (needed for INSERT ... RETURNING).

DROP POLICY IF EXISTS "Workspaces viewable by members" ON public.workspaces;
CREATE POLICY "Workspaces viewable by members"
  ON public.workspaces FOR SELECT
  USING (
    public.is_workspace_member(id)
    OR created_by = auth.uid()
  );

-- Ensure authenticated users can use tables through RLS policies
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
