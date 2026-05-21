"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, ItemStatus, ITEM_STATUSES, Profile, WorkspaceMember } from "@/lib/types";

interface ItemFiltersProps {
  statusFilter: ItemStatus | "all";
  onStatusChange: (v: ItemStatus | "all") => void;
  categoryFilter: string | "all";
  onCategoryChange: (v: string | "all") => void;
  assigneeFilter: string | "all";
  onAssigneeChange: (v: string | "all") => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categories: Category[];
  members: (WorkspaceMember & { profile: Profile | null })[];
}

export function ItemFilters({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  assigneeFilter,
  onAssigneeChange,
  searchQuery,
  onSearchChange,
  categories,
  members,
}: ItemFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-48 text-sm"
      />
      <Select value={statusFilter} onValueChange={(v) => onStatusChange((v as ItemStatus | "all") ?? "all")}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ITEM_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v ?? "all")}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={assigneeFilter} onValueChange={(v) => onAssigneeChange(v ?? "all")}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              {m.profile?.full_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
