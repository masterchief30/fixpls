import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-6">
        <span className="text-sm font-medium">plsfix</span>
      </header>
      <main className="flex-1 p-6">
        <WorkspacesList workspaces={formatted} />
      </main>
    </div>
  );
}
