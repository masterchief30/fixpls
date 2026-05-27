-- Allow workspace admins to delete an entire workspace.
-- Child rows are removed by ON DELETE CASCADE constraints.

DROP POLICY IF EXISTS "Workspaces deletable by admins" ON public.workspaces;
CREATE POLICY "Workspaces deletable by admins"
  ON public.workspaces FOR DELETE
  USING (public.is_workspace_admin(id));
