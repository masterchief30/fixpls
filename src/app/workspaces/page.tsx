import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { WorkspacesList } from "@/components/workspaces-list";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspaces, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspaces:workspace_id (
        id,
        name,
        created_at,
        created_by
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
  }

  const formatted = workspaces?.map((w: unknown) => {
    const row = w as { role: string; workspaces: { id: string; name: string; created_at: string; created_by: string } };
    return {
      ...row.workspaces,
      user_role: row.role as "admin" | "member",
    };
  }) ?? [];

  return (
    <AppShell>
      <WorkspacesList workspaces={formatted} />
    </AppShell>
  );
}
