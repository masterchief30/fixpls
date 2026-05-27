"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { ItemsTable } from "./items-table";
import { ItemFilters } from "./item-filters";
import { CreateItemSheet } from "./create-item-sheet";
import { ItemDetailSheet } from "./item-detail-sheet";
import { InviteMembersDialog } from "./invite-members-dialog";
import { TeamMembersDialog } from "./team-members-dialog";
import { ManageComponentsDialog } from "./manage-components-dialog";
import { ManageStatusesDialog } from "./manage-statuses-dialog";
import { ManageCategoriesDialog } from "./manage-categories-dialog";
import { ManageCompaniesDialog } from "./manage-companies-dialog";
import {
  Category,
  Company,
  CompanyDomain,
  Component,
  ItemWithDetails,
  Profile,
  Status,
  WorkspaceMember,
  DEFAULT_ITEM_STATUSES,
  ItemStatus,
} from "@/lib/types";

interface WorkspaceClientProps {
  workspaceId: string;
  initialCategories: Category[];
  initialCompanies: Company[];
  initialComponents: Component[];
  initialStatuses: Status[];
  initialCompanyDomains: CompanyDomain[];
  initialItems: ItemWithDetails[];
  initialMembers: (WorkspaceMember & { profile: Profile | null })[];
  userRole: "admin" | "member";
}

export function WorkspaceClient({
  workspaceId,
  initialCategories,
  initialCompanies,
  initialComponents,
  initialStatuses,
  initialCompanyDomains,
  initialItems,
  initialMembers,
  userRole,
}: WorkspaceClientProps) {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [statuses, setStatuses] = useState<Status[]>(initialStatuses);
  const [companyDomains, setCompanyDomains] = useState<CompanyDomain[]>(
    initialCompanyDomains
  );
  const [items, setItems] = useState<ItemWithDetails[]>(initialItems);
  const [members] = useState<(WorkspaceMember & { profile: Profile | null })[]>(
    initialMembers
  );

  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [componentFilter, setComponentFilter] = useState<string | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");
  const [ownerCompanyFilter, setOwnerCompanyFilter] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [componentsDialogOpen, setComponentsDialogOpen] = useState(false);
  const [companiesDialogOpen, setCompaniesDialogOpen] = useState(false);
  const [statusesDialogOpen, setStatusesDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [teamMembersDialogOpen, setTeamMembersDialogOpen] = useState(false);
  const statusOptions = useMemo(() => {
    const base = statuses.length
      ? statuses
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((status) => status.name)
      : DEFAULT_ITEM_STATUSES;
    const all = [...base];
    for (const item of items) {
      if (!all.includes(item.status)) {
        all.push(item.status);
      }
    }
    return all;
  }, [statuses, items]);
  const memberProfilesById = useMemo(
    () =>
      new Map(
        members.map((member) => [member.user_id, member.profile] as const)
      ),
    [members]
  );

  const hydrateItems = useCallback(
    (rows: ItemWithDetails[]) =>
      rows.map((row) => ({
        ...row,
        category:
          row.category ?? categories.find((category) => category.id === row.category_id) ?? null,
        component:
          row.component ??
          components.find((component) => component.id === row.component_id) ??
          null,
        owner_company:
          row.owner_company ??
          companies.find((company) => company.id === row.owner_company_id) ??
          null,
        assignee:
          row.assignee ??
          (row.assignee_id ? memberProfilesById.get(row.assignee_id) ?? null : null),
        creator: row.creator ?? memberProfilesById.get(row.created_by) ?? null,
      })),
    [categories, components, companies, memberProfilesById]
  );

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      if (componentFilter !== "all" && item.component_id !== componentFilter) return false;
      if (assigneeFilter !== "all" && item.assignee_id !== assigneeFilter) return false;
      if (ownerCompanyFilter !== "all" && item.owner_company_id !== ownerCompanyFilter) {
        return false;
      }
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Keep closed items at the bottom for easier active-work triage.
    return filtered.sort((a, b) => {
      const aClosed = a.status.trim().toLowerCase() === "closed";
      const bClosed = b.status.trim().toLowerCase() === "closed";
      if (aClosed === bClosed) return 0;
      return aClosed ? 1 : -1;
    });
  }, [
    items,
    statusFilter,
    categoryFilter,
    componentFilter,
    assigneeFilter,
    ownerCompanyFilter,
    searchQuery,
  ]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        category:categories!items_category_id_fkey (*),
        component:components!items_component_id_fkey (*),
        owner_company:companies!items_owner_company_id_fkey (*)
      `)
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch items with embedded relations:", error.message);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("items")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });

      if (fallbackError) {
        console.error("Failed to fetch items fallback:", fallbackError.message);
        return;
      }

      const fallbackRows = (fallbackData ?? []) as unknown as ItemWithDetails[];
      const profileIds = Array.from(
        new Set(
          fallbackRows
            .flatMap((row) => [row.created_by, row.assignee_id])
            .filter((value): value is string => Boolean(value))
        )
      );
      let extraProfilesById = new Map<string, Profile>();
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);
        const safeProfiles = (profiles ?? []) as unknown as Profile[];
        extraProfilesById = new Map(
          safeProfiles.map((profile) => [profile.id, profile])
        );
      }

      setItems(
        hydrateItems(fallbackRows).map((row) => ({
          ...row,
          assignee:
            row.assignee ??
            (row.assignee_id ? extraProfilesById.get(row.assignee_id) ?? null : null),
          creator: row.creator ?? extraProfilesById.get(row.created_by) ?? null,
        }))
      );
      return;
    }

    const rows = (data ?? []) as unknown as ItemWithDetails[];
    const profileIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.created_by, row.assignee_id])
          .filter((value): value is string => Boolean(value))
      )
    );
    let extraProfilesById = new Map<string, Profile>();
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds);
      const safeProfiles = (profiles ?? []) as unknown as Profile[];
      extraProfilesById = new Map(
        safeProfiles.map((profile) => [profile.id, profile])
      );
    }

    setItems(
      hydrateItems(rows).map((row) => ({
        ...row,
        assignee:
          row.assignee ??
          (row.assignee_id ? extraProfilesById.get(row.assignee_id) ?? null : null),
        creator: row.creator ?? extraProfilesById.get(row.created_by) ?? null,
      }))
    );
  }, [supabase, workspaceId, hydrateItems]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (data) setCategories(data);
  }, [supabase, workspaceId]);

  const fetchCompanies = useCallback(async () => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (data) setCompanies(data);
  }, [supabase, workspaceId]);

  const fetchComponents = useCallback(async () => {
    const { data } = await supabase
      .from("components")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (data) setComponents(data);
  }, [supabase, workspaceId]);

  const fetchStatuses = useCallback(async () => {
    const { data } = await supabase
      .from("statuses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order");
    if (data) setStatuses(data);
  }, [supabase, workspaceId]);

  const fetchCompanyDomains = useCallback(async () => {
    const { data } = await supabase
      .from("company_domains")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("domain");
    if (data) setCompanyDomains(data);
  }, [supabase, workspaceId]);

  const handleItemCreated = useCallback(
    async (createdItem?: ItemWithDetails) => {
      if (createdItem) {
        setItems((previous) => [
          createdItem,
          ...previous.filter((item) => item.id !== createdItem.id),
        ]);
      }
      await fetchItems();
    },
    [fetchItems]
  );

  const handleTableStatusChange = useCallback(
    async (itemId: string, nextStatus: string) => {
      const current = items.find((item) => item.id === itemId);
      if (!current || current.status === nextStatus) return;

      const previousStatus = current.status;
      setItems((previous) =>
        previous.map((item) =>
          item.id === itemId
            ? { ...item, status: nextStatus, updated_at: new Date().toISOString() }
            : item
        )
      );

      const { data: authUserData } = await supabase.auth.getUser();
      const currentUser = authUserData.user;
      const { error } = await supabase
        .from("items")
        .update({ status: nextStatus })
        .eq("id", itemId);
      if (error) {
        console.error("Failed to update status from table:", error.message);
        await fetchItems();
        return;
      }

      if (currentUser) {
        const { error: activityError } = await supabase.from("activity_log").insert({
          item_id: itemId,
          user_id: currentUser.id,
          action_type: "status_change",
          from_value: previousStatus,
          to_value: nextStatus,
        });
        if (activityError) {
          console.error("Failed to log status change activity:", activityError.message);
        }
      }
      await fetchItems();
    },
    [items, supabase, fetchItems]
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `workspace_id=eq.${workspaceId}` },
        () => fetchItems()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `workspace_id=eq.${workspaceId}` },
        () => fetchCategories()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies", filter: `workspace_id=eq.${workspaceId}` },
        () => {
          fetchCompanies();
          fetchItems();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "components", filter: `workspace_id=eq.${workspaceId}` },
        () => {
          fetchComponents();
          fetchItems();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "statuses", filter: `workspace_id=eq.${workspaceId}` },
        () => {
          fetchStatuses();
          fetchItems();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_domains", filter: `workspace_id=eq.${workspaceId}` },
        () => fetchCompanyDomains()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    supabase,
    workspaceId,
    fetchItems,
    fetchCategories,
    fetchCompanies,
    fetchComponents,
    fetchStatuses,
    fetchCompanyDomains,
  ]);

  useEffect(() => {
    if (statusFilter === "all") return;
    const validStatuses = new Set(statuses.map((status) => status.name));
    if (!validStatuses.has(statusFilter)) {
      setStatusFilter("all");
    }
  }, [statuses, statusFilter]);

  useEffect(() => {
    if (ownerCompanyFilter === "all") return;
    const validCompanyIds = new Set(companies.map((company) => company.id));
    if (!validCompanyIds.has(ownerCompanyFilter)) {
      setOwnerCompanyFilter("all");
    }
  }, [companies, ownerCompanyFilter]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    const validCategoryIds = new Set(categories.map((category) => category.id));
    if (!validCategoryIds.has(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categories, categoryFilter]);

  useEffect(() => {
    if (componentFilter === "all") return;
    const validComponentIds = new Set(components.map((component) => component.id));
    if (!validComponentIds.has(componentFilter)) {
      setComponentFilter("all");
    }
  }, [components, componentFilter]);

  useEffect(() => {
    if (assigneeFilter === "all") return;
    const validAssigneeIds = new Set(members.map((member) => member.user_id));
    if (!validAssigneeIds.has(assigneeFilter)) {
      setAssigneeFilter("all");
    }
  }, [members, assigneeFilter]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Sidebar
        userRole={userRole}
        onNewItem={() => setCreateOpen(true)}
        onNewCategory={() => {
          fetchCategories();
          setCategoriesDialogOpen(true);
        }}
        onNewComponent={() => {
          fetchComponents();
          setComponentsDialogOpen(true);
        }}
        onNewCompany={() => {
          fetchCompanies();
          setCompaniesDialogOpen(true);
        }}
        onNewStatus={() => {
          fetchStatuses();
          setStatusesDialogOpen(true);
        }}
        onInvite={() => setInviteDialogOpen(true)}
        onTeamMembers={() => setTeamMembersDialogOpen(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-end gap-2 border-b border-slate-800/70 bg-[#0e1525] px-3 py-3">
          <div>
            <ItemFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              componentFilter={componentFilter}
              onComponentChange={setComponentFilter}
              assigneeFilter={assigneeFilter}
              onAssigneeChange={setAssigneeFilter}
              ownerCompanyFilter={ownerCompanyFilter}
              onOwnerCompanyChange={setOwnerCompanyFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statuses={statuses}
              categories={categories}
              components={components}
              companies={companies}
              members={members}
            />
          </div>
        </div>
        <ItemsTable
          items={filteredItems}
          statusOptions={statusOptions}
          onItemClick={setSelectedItemId}
          onStatusChange={handleTableStatusChange}
        />
      </div>

      <CreateItemSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        categories={categories}
        components={components}
        statuses={statuses}
        companies={companies}
        members={members}
        onCreated={handleItemCreated}
      />

      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItemId}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
        categories={categories}
        components={components}
        statuses={statuses}
        companies={companies}
        members={members}
        onUpdated={fetchItems}
      />

      <ManageComponentsDialog
        open={componentsDialogOpen}
        onOpenChange={setComponentsDialogOpen}
        workspaceId={workspaceId}
        components={components}
        onChanged={fetchComponents}
      />

      <ManageCompaniesDialog
        open={companiesDialogOpen}
        onOpenChange={setCompaniesDialogOpen}
        workspaceId={workspaceId}
        companies={companies}
        onChanged={() => {
          fetchCompanies();
          fetchCompanyDomains();
          fetchItems();
        }}
      />

      <ManageCategoriesDialog
        open={categoriesDialogOpen}
        onOpenChange={setCategoriesDialogOpen}
        workspaceId={workspaceId}
        categories={categories}
        onChanged={fetchCategories}
      />

      <ManageStatusesDialog
        open={statusesDialogOpen}
        onOpenChange={setStatusesDialogOpen}
        workspaceId={workspaceId}
        statuses={statuses}
        onChanged={fetchStatuses}
      />

      <InviteMembersDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        workspaceId={workspaceId}
        companies={companies}
        companyDomains={companyDomains}
        onInvited={() => {
          fetchCompanyDomains();
        }}
      />

      <TeamMembersDialog
        open={teamMembersDialogOpen}
        onOpenChange={setTeamMembersDialogOpen}
        members={members}
      />
    </div>
  );
}
