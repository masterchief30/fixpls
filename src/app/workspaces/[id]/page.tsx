import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { WorkspaceClient } from "@/components/workspace-detail/workspace-client";
import {
  Category,
  Company,
  CompanyDomain,
  Component,
  ItemWithDetails,
  Profile,
  Status,
  WorkspaceMember,
} from "@/lib/types";

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

  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", id)
    .order("name");

  const { data: components } = await supabase
    .from("components")
    .select("*")
    .eq("workspace_id", id)
    .order("name");

  const { data: statuses } = await supabase
    .from("statuses")
    .select("*")
    .eq("workspace_id", id)
    .order("sort_order");

  const { data: companyDomains } = await supabase
    .from("company_domains")
    .select("*")
    .eq("workspace_id", id)
    .order("domain");

  const { data: items } = await supabase
    .from("items")
    .select(`
      *,
      category:category_id (*),
      component:component_id (*),
      owner_company:owner_company_id (*),
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
    <AppShell backHref="/workspaces" flush>
      <WorkspaceClient
        workspaceId={id}
        initialCategories={(categories ?? []) as unknown as Category[]}
        initialCompanies={(companies ?? []) as unknown as Company[]}
        initialComponents={(components ?? []) as unknown as Component[]}
        initialStatuses={(statuses ?? []) as unknown as Status[]}
        initialCompanyDomains={(companyDomains ?? []) as unknown as CompanyDomain[]}
        initialItems={(items ?? []) as unknown as ItemWithDetails[]}
        initialMembers={(members ?? []) as unknown as (WorkspaceMember & { profile: Profile | null })[]}
        userRole={(membership as { role: string }).role as "admin" | "member"}
      />
    </AppShell>
  );
}
