"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./sidebar";
import { ItemsTable } from "./items-table";
import { ItemFilters } from "./item-filters";
import { CreateItemSheet } from "./create-item-sheet";
import { ItemDetailSheet } from "./item-detail-sheet";
import { InviteMembersDialog } from "./invite-members-dialog";
import { ManageComponentsDialog } from "./manage-components-dialog";
import { ManageStatusesDialog } from "./manage-statuses-dialog";
import {
  Category,
  Company,
  CompanyDomain,
  Component,
  ItemWithDetails,
  Profile,
  Status,
  WorkspaceMember,
  ItemStatus,
} from "@/lib/types";

interface WorkspaceClientProps {
  workspaceId: string;
  workspaceName: string;
  workspaceDefaultOwnerCompanyId: string | null;
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
  workspaceName,
  workspaceDefaultOwnerCompanyId,
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
  const [defaultOwnerCompanyId, setDefaultOwnerCompanyId] = useState<string | null>(
    workspaceDefaultOwnerCompanyId
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
  const [addCategoryRequestId, setAddCategoryRequestId] = useState(0);
  const [componentsDialogOpen, setComponentsDialogOpen] = useState(false);
  const [statusesDialogOpen, setStatusesDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      if (componentFilter !== "all" && item.component_id !== componentFilter) return false;
      if (assigneeFilter !== "all" && item.assignee_id !== assigneeFilter) return false;
      const effectiveOwnerCompanyId = item.owner_company_id ?? defaultOwnerCompanyId;
      if (ownerCompanyFilter !== "all" && effectiveOwnerCompanyId !== ownerCompanyFilter) {
        return false;
      }
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [
    items,
    statusFilter,
    categoryFilter,
    componentFilter,
    assigneeFilter,
    ownerCompanyFilter,
    defaultOwnerCompanyId,
    searchQuery,
  ]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("items")
      .select(`
        *,
        category:category_id (*),
        component:component_id (*),
        owner_company:owner_company_id (*),
        assignee:assignee_id (*),
        creator:created_by (*)
      `)
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (data) {
      setItems(data as unknown as ItemWithDetails[]);
    }
  }, [supabase, workspaceId]);

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

  const fetchWorkspaceMeta = useCallback(async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("default_owner_company_id")
      .eq("id", workspaceId)
      .single();
    if (data) {
      setDefaultOwnerCompanyId(data.default_owner_company_id);
    }
  }, [supabase, workspaceId]);

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
          fetchWorkspaceMeta();
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
    fetchWorkspaceMeta,
  ]);

  useEffect(() => {
    if (statusFilter === "all") return;
    const validStatuses = new Set(statuses.map((status) => status.name));
    if (!validStatuses.has(statusFilter)) {
      setStatusFilter("all");
    }
  }, [statuses, statusFilter]);

  const handleDefaultOwnerCompanyChange = async (value: string) => {
    const nextId = value === "none" ? null : value;
    const { error } = await supabase
      .from("workspaces")
      .update({ default_owner_company_id: nextId })
      .eq("id", workspaceId);
    if (!error) {
      setDefaultOwnerCompanyId(nextId);
      fetchItems();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Sidebar
        workspaceId={workspaceId}
        categories={categories}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onCategoriesChange={fetchCategories}
        userRole={userRole}
        onNewItem={() => setCreateOpen(true)}
        onNewCategory={() => setAddCategoryRequestId((prev) => prev + 1)}
        onNewComponent={() => setComponentsDialogOpen(true)}
        onNewStatus={() => setStatusesDialogOpen(true)}
        onInvite={() => setInviteDialogOpen(true)}
        companies={companies}
        defaultOwnerCompanyId={defaultOwnerCompanyId}
        onDefaultOwnerChange={handleDefaultOwnerCompanyChange}
        addCategoryRequestId={addCategoryRequestId}
        showHeaderAddButton={false}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {workspaceName}
          </span>
          <div className="ml-auto">
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
          defaultOwnerCompanyId={defaultOwnerCompanyId}
          onItemClick={setSelectedItemId}
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
        defaultOwnerCompanyId={defaultOwnerCompanyId}
        onCreated={fetchItems}
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
        defaultOwnerCompanyId={defaultOwnerCompanyId}
        onUpdated={fetchItems}
      />

      <ManageComponentsDialog
        open={componentsDialogOpen}
        onOpenChange={setComponentsDialogOpen}
        workspaceId={workspaceId}
        components={components}
        onChanged={fetchComponents}
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
    </div>
  );
}
