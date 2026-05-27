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

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select(`
      *,
      category:categories!items_category_id_fkey (*),
      component:components!items_component_id_fkey (*),
      owner_company:companies!items_owner_company_id_fkey (*)
    `)
    .eq("workspace_id", id)
    .order("updated_at", { ascending: false });

  let resolvedItems = items;
  if (itemsError) {
    console.error("Workspace items query failed with embeds:", itemsError.message);
    const { data: fallbackItems, error: fallbackItemsError } = await supabase
      .from("items")
      .select("*")
      .eq("workspace_id", id)
      .order("updated_at", { ascending: false });

    if (fallbackItemsError) {
      console.error("Workspace items fallback query failed:", fallbackItemsError.message);
    } else {
      resolvedItems = fallbackItems;
    }
  }

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, company_id, created_at")
    .eq("workspace_id", id);

  const safeCategories = (categories ?? []) as unknown as Category[];
  const safeComponents = (components ?? []) as unknown as Component[];
  const safeCompanies = (companies ?? []) as unknown as Company[];
  const rawMembers = (members ?? []) as unknown as WorkspaceMember[];
  const memberIds = Array.from(new Set(rawMembers.map((member) => member.user_id)));
  let profilesById = new Map<string, Profile>();
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", memberIds);
    const safeProfiles = (profiles ?? []) as unknown as Profile[];
    profilesById = new Map(safeProfiles.map((profile) => [profile.id, profile]));
  }

  const safeMembers = rawMembers.map((member) => ({
    ...member,
    profile: profilesById.get(member.user_id) ?? null,
  }));
  const safeItems = (resolvedItems ?? []) as ItemWithDetails[];

  const itemProfileIds = Array.from(
    new Set(
      safeItems
        .flatMap((item) => [item.created_by, item.assignee_id])
        .filter((value): value is string => Boolean(value))
    )
  );
  const missingProfileIds = itemProfileIds.filter((id) => !profilesById.has(id));
  if (missingProfileIds.length > 0) {
    const { data: missingProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", missingProfileIds);
    const safeMissingProfiles = (missingProfiles ?? []) as unknown as Profile[];
    for (const profile of safeMissingProfiles) {
      profilesById.set(profile.id, profile);
    }
  }

  const hydratedItems = safeItems.map((item) => ({
    ...item,
    category:
      item.category ??
      safeCategories.find((category) => category.id === item.category_id) ??
      null,
    component:
      item.component ??
      safeComponents.find((component) => component.id === item.component_id) ??
      null,
    owner_company:
      item.owner_company ??
      safeCompanies.find((company) => company.id === item.owner_company_id) ??
      null,
    assignee: item.assignee ?? (item.assignee_id ? profilesById.get(item.assignee_id) ?? null : null),
    creator: item.creator ?? profilesById.get(item.created_by) ?? null,
  }));

  return (
    <AppShell backHref="/workspaces" flush>
      <WorkspaceClient
        workspaceId={id}
        initialCategories={safeCategories}
        initialCompanies={safeCompanies}
        initialComponents={safeComponents}
        initialStatuses={(statuses ?? []) as unknown as Status[]}
        initialCompanyDomains={(companyDomains ?? []) as unknown as CompanyDomain[]}
        initialItems={hydratedItems}
        initialMembers={safeMembers}
        userRole={(membership as { role: string }).role as "admin" | "member"}
      />
    </AppShell>
  );
}
