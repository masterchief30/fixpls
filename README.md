# plsfix — Client Feedback & Bug Tracking Portal

A Linear-inspired client portal for tracking bugs, feedback, and feature requests. Built with Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- **Workspaces** — Shared spaces between your team and a client's team
- **Items** — Bug reports, feedback, and feature requests with status, category, assignee, and description
- **Comment Threads** — Time-ordered storyboard of comments and activity (status changes, category changes, assignee changes)
- **Realtime** — New comments, status changes, and items appear live without refresh via Supabase Realtime
- **Minimal Design** — Clean, monochrome UI inspired by Linear and Height

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base-nova style)
- Supabase (Auth, Postgres, Realtime)
- date-fns

## Setup

### 1. Clone & Install

```bash
cd plsfix
pnpm install
```

### 2. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

Find these in your Supabase project dashboard under **Project Settings > API**.
Only the publishable key is used by this app right now. Keep the secret key server-only.

### 4. Run Migrations

Open the Supabase SQL Editor and run the migration files in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_realtime.sql`

Or use the Supabase CLI:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 5. Seed a Test Workspace (Optional)

Run this SQL in the Supabase SQL Editor to create a test workspace after signing up:

```sql
-- Replace with your actual user ID after signing up
DO $$
DECLARE
  user_id uuid := 'your-user-id-here';
  ws_id uuid;
BEGIN
  INSERT INTO workspaces (name, created_by)
  VALUES ('Test Workspace', user_id)
  RETURNING id INTO ws_id;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, user_id, 'admin');

  INSERT INTO categories (workspace_id, name, color)
  VALUES
    (ws_id, 'Bugs', '#ef4444'),
    (ws_id, 'Feedback', '#3b82f6'),
    (ws_id, 'Features', '#10b981');
END $$;
```

### 6. Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth & Access Control

- Email + password auth via Supabase Auth
- Row Level Security (RLS) policies ensure users can only access workspaces they belong to
- Workspace admins can create categories and delete items; members can create and update items

## Realtime

Realtime is enabled on `items`, `comments`, `activity_log`, `categories`, and `workspace_members`. The workspace view subscribes to changes so new items, comments, and status updates appear instantly.

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)
4. Deploy

## Project Structure

```
src/
  app/                 # Next.js App Router pages
  components/          # React components
    ui/                # shadcn/ui components
    workspace-detail/  # Workspace view components
  lib/                 # Utilities, types, Supabase clients
supabase/
  migrations/          # SQL schema + RLS policies
```
