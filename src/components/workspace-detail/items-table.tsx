"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { ItemWithDetails } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ItemsTableProps {
  items: ItemWithDetails[];
  onItemClick: (id: string) => void;
}

export function ItemsTable({
  items,
  onItemClick,
}: ItemsTableProps) {
  const resolveOwner = (item: ItemWithDetails) => {
    if (item.owner_company) return item.owner_company.name;
    if (item.owner_company_id && !item.owner_company) return "Unknown company";
    return "—";
  };

  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-[28%]">Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Menu Component</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => onItemClick(item.id)}
              >
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  {item.category ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.category.color }}
                      />
                      {item.category.name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {item.component?.name ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {resolveOwner(item)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {item.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 text-[10px]">
                        <AvatarFallback>
                          {item.assignee.full_name?.charAt(0) ?? item.assignee.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {item.assignee.full_name ?? item.assignee.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
