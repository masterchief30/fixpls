"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ItemsTable } from "./items-table";
import { ItemFilters } from "./item-filters";
import { CreateItemSheet } from "./create-item-sheet";
import { ItemDetailSheet } from "./item-detail-sheet";
import {
  Category,
  ItemWithDetails,
  Profile,
  WorkspaceMember,
  ItemStatus,
} from "@/lib/types";

interface WorkspaceClientProps {
  workspaceId: string;
  initialCategories: Category[];
  initialItems: ItemWithDetails[];
  initialMembers: (WorkspaceMember & { profile: Profile | null })[];
  userRole: "admin" | "member";
}

export function WorkspaceClient({
  workspaceId,
  initialCategories,
  initialItems,
  initialMembers,
  userRole,
}: WorkspaceClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<ItemWithDetails[]>(initialItems);
  const [members] = useState<(WorkspaceMember & { profile: Profile | null })[]>(initialMembers);

  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
      if (assigneeFilter !== "all" && item.assignee_id !== assigneeFilter) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, statusFilter, categoryFilter, assigneeFilter, searchQuery]);

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, workspaceId, fetchItems, fetchCategories]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Sidebar
        workspaceId={workspaceId}
        categories={categories}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onCategoriesChange={fetchCategories}
        userRole={userRole}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <ItemFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeChange={setAssigneeFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            members={members}
          />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New item
          </Button>
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
        members={members}
        onCreated={fetchItems}
      />

      <ItemDetailSheet
        item={selectedItem}
        open={!!selectedItemId}
        onOpenChange={(open) => !open && setSelectedItemId(null)}
        categories={categories}
        members={members}
        onUpdated={fetchItems}
      />
    </div>
  );
}
