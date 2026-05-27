-- Enforce admin-only workspace deletion for existing installs.

DROP POLICY IF EXISTS "Workspaces deletable by admins" ON public.workspaces;
CREATE POLICY "Workspaces deletable by admins"
  ON public.workspaces FOR DELETE
  USING (public.is_workspace_admin(id));
