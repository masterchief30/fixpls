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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-end gap-2 border-b border-white/10 bg-slate-900/40 px-3 py-3">
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
    </div>
  );
}
