import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceClient } from "@/components/workspace-detail/workspace-client";
import { Category, ItemWithDetails, Profile, WorkspaceMember } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspacePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("workspace_id", id)
    .order("name");

  const { data: items } = await supabase
    .from("items")
    .select(`
      *,
      category:category_id (*),
      assignee:assignee_id (*),
      creator:created_by (*)
    `)
    .eq("workspace_id", id)
    .order("updated_at", { ascending: false });

  const { data: members } = await supabase
    .from("workspace_members")
    .select(`
      workspace_id,
      user_id,
      role,
      profile:user_id (*)
    `)
    .eq("workspace_id", id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-6">
        <a href="/workspaces" className="text-sm font-medium hover:underline">
          plsfix
        </a>
      </header>
      <WorkspaceClient
        workspaceId={id}
        initialCategories={(categories ?? []) as unknown as Category[]}
        initialItems={(items ?? []) as unknown as ItemWithDetails[]}
        initialMembers={(members ?? []) as unknown as (WorkspaceMember & { profile: Profile | null })[]}
        userRole={(membership as { role: string }).role as "admin" | "member"}
      />
    </div>
  );
}
