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
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Search
        </span>
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-40 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </span>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange((v as ItemStatus | "all") ?? "all")}
        >
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            <SelectItem value="all">all</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </span>
        <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v ?? "all")}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            <SelectItem value="all">all</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu Component
        </span>
        <Select value={componentFilter} onValueChange={(v) => onComponentChange(v ?? "all")}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Menu Component" />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            <SelectItem value="all">all</SelectItem>
            {components.map((component) => (
              <SelectItem key={component.id} value={component.id}>
                {component.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Assignee
        </span>
        <Select value={assigneeFilter} onValueChange={(v) => onAssigneeChange(v ?? "all")}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            <SelectItem value="all">all</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile?.full_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Owner
        </span>
        <Select
          value={ownerCompanyFilter}
          onValueChange={(v) => onOwnerCompanyChange(v ?? "all")}
        >
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="Owner company" />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            <SelectItem value="all">all</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
