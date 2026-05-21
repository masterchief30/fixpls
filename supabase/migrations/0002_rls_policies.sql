-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles (needed for assignee display)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Workspaces: visible if member
CREATE POLICY "Workspaces viewable by members"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspaces insertable by authenticated users"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Workspace members: visible if member of same workspace
CREATE POLICY "Workspace members viewable by members"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members insertable by admins"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

CREATE POLICY "Workspace members deletable by admins"
  ON public.workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- Categories: visible if workspace member, manageable by admins
CREATE POLICY "Categories viewable by workspace members"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = categories.workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Categories insertable by admins"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = categories.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

CREATE POLICY "Categories updatable by admins"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = categories.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

CREATE POLICY "Categories deletable by admins"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = categories.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- Items: visible if workspace member, insert/update by members, delete by admins
CREATE POLICY "Items viewable by workspace members"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = items.workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Items insertable by workspace members"
  ON public.items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = items.workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Items updatable by workspace members"
  ON public.items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = items.workspace_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Items deletable by admins"
  ON public.items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = items.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- Comments: visible if workspace member (via item), insert by members, delete by author or admin
CREATE POLICY "Comments viewable by workspace members"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.workspace_members wm ON wm.workspace_id = i.workspace_id
      WHERE i.id = comments.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Comments insertable by workspace members"
  ON public.comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.workspace_members wm ON wm.workspace_id = i.workspace_id
      WHERE i.id = comments.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Comments deletable by author or admin"
  ON public.comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.workspace_members wm ON wm.workspace_id = i.workspace_id
      WHERE i.id = comments.item_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- Activity log: visible if workspace member, insert by members (system writes)
CREATE POLICY "Activity log viewable by workspace members"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.workspace_members wm ON wm.workspace_id = i.workspace_id
      WHERE i.id = activity_log.item_id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Activity log insertable by workspace members"
  ON public.activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items i
      JOIN public.workspace_members wm ON wm.workspace_id = i.workspace_id
      WHERE i.id = activity_log.item_id AND wm.user_id = auth.uid()
    )
  );
