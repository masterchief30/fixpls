-- Optional invitee name for onboarding context.

ALTER TABLE public.workspace_invites
  ADD COLUMN IF NOT EXISTS invited_name TEXT;
