"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Category,
  Company,
  Component,
  DEFAULT_ITEM_STATUSES,
  ItemStatus,
  Profile,
  Status,
  WorkspaceMember,
} from "@/lib/types";

interface ItemFiltersProps {
  statusFilter: ItemStatus | "all";
  onStatusChange: (v: ItemStatus | "all") => void;
  categoryFilter: string | "all";
  onCategoryChange: (v: string | "all") => void;
  componentFilter: string | "all";
  onComponentChange: (v: string | "all") => void;
  assigneeFilter: string | "all";
  onAssigneeChange: (v: string | "all") => void;
  ownerCompanyFilter: string | "all";
  onOwnerCompanyChange: (v: string | "all") => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statuses: Status[];
  categories: Category[];
  components: Component[];
  companies: Company[];
  members: (WorkspaceMember & { profile: Profile | null })[];
}

export function ItemFilters({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  componentFilter,
  onComponentChange,
  assigneeFilter,
  onAssigneeChange,
  ownerCompanyFilter,
  onOwnerCompanyChange,
  searchQuery,
  onSearchChange,
  statuses,
  categories,
  components,
  companies,
  members,
}: ItemFiltersProps) {
  const statusOptions = statuses.length
    ? statuses
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((status) => status.name)
    : DEFAULT_ITEM_STATUSES;

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
          {statusOptions.map((s) => (
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
      <Select value={componentFilter} onValueChange={(v) => onComponentChange(v ?? "all")}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Component" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All components</SelectItem>
          {components.map((component) => (
            <SelectItem key={component.id} value={component.id}>
              {component.name}
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
      <Select
        value={ownerCompanyFilter}
        onValueChange={(v) => onOwnerCompanyChange(v ?? "all")}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Owner company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owner companies</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
