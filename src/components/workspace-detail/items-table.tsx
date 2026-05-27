"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemWithDetails } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ItemsTableProps {
  items: ItemWithDetails[];
  statusOptions: string[];
  onItemClick: (id: string) => void;
  onStatusChange: (itemId: string, status: string) => void | Promise<void>;
}

export function ItemsTable({
  items,
  statusOptions,
  onItemClick,
  onStatusChange,
}: ItemsTableProps) {
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    itemId: string;
    itemTitle: string;
    fromStatus: string;
    toStatus: string;
  } | null>(null);
  const resolveOwner = (item: ItemWithDetails) => {
    if (item.owner_company) return item.owner_company.name;
    if (item.owner_company_id && !item.owner_company) return "Unknown company";
    return "—";
  };
  const resolveCreator = (item: ItemWithDetails) => {
    if (!item.creator) return "—";
    return item.creator.full_name ?? item.creator.email;
  };
  const normalizeStatus = (status: string) => status.trim().toLowerCase();
  const getStatusSelectClass = (status: string) => {
    switch (normalizeStatus(status)) {
      case "fixed":
        return "border-emerald-500/40 bg-transparent text-emerald-300";
      case "new":
        return "border-sky-500/40 bg-transparent text-sky-300";
      case "in progress":
        return "border-amber-500/40 bg-transparent text-amber-300";
      case "delayed":
      case "delazed":
        return "border-orange-500/40 bg-transparent text-orange-300";
      case "blocked":
        return "border-rose-500/40 bg-transparent text-rose-300";
      case "closed":
        return "border-slate-600/50 bg-transparent text-slate-400";
      default:
        return "border-slate-700/60 bg-transparent text-slate-300";
    }
  };
  const getRowHighlightClass = (status: string) => {
    switch (normalizeStatus(status)) {
      case "fixed":
        return "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]";
      case "new":
        return "bg-sky-500/[0.04] hover:bg-sky-500/[0.08]";
      case "in progress":
        return "bg-amber-500/[0.05] hover:bg-amber-500/[0.09]";
      case "delayed":
      case "delazed":
        return "bg-orange-500/[0.05] hover:bg-orange-500/[0.09]";
      case "blocked":
        return "bg-rose-500/[0.06] hover:bg-rose-500/[0.10]";
      case "closed":
        return "bg-slate-800/30 text-slate-500 hover:bg-slate-800/40";
      default:
        return "hover:bg-slate-800/20";
    }
  };
  const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, "dd MMM yyyy HH:mm");
  };

  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-[#0e1525]">
          <TableRow className="border-slate-800/70 hover:bg-transparent">
            <TableHead className="w-[22%]">Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Menu Component</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer ${getRowHighlightClass(item.status)}`}
                onClick={() => onItemClick(item.id)}
              >
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  {item.category ? (
                    <span className="text-sm">{item.category.name}</span>
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
                <TableCell className="text-sm text-muted-foreground">
                  {resolveCreator(item)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(item.updated_at)}
                </TableCell>
                <TableCell>
                  <div onClick={(event) => event.stopPropagation()}>
                    <Select
                      value={item.status}
                      onValueChange={(nextStatus) => {
                        const targetStatus = nextStatus ?? item.status;
                        if (targetStatus === item.status) return;
                        setPendingStatusChange({
                          itemId: item.id,
                          itemTitle: item.title,
                          fromStatus: item.status,
                          toStatus: targetStatus,
                        });
                      }}
                    >
                      <SelectTrigger
                        className={`h-8 w-36 text-xs ${getStatusSelectClass(item.status)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={!!pendingStatusChange}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingStatusChange(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!pendingStatusChange) return;
              void onStatusChange(
                pendingStatusChange.itemId,
                pendingStatusChange.toStatus
              );
              setPendingStatusChange(null);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Save new status?</DialogTitle>
            <DialogDescription>
              {pendingStatusChange
                ? `Change "${pendingStatusChange.itemTitle}" from ${pendingStatusChange.fromStatus} to ${pendingStatusChange.toStatus}?`
                : "Confirm status change."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingStatusChange(null)}
            >
              No
            </Button>
            <Button
              type="button"
              autoFocus
              onClick={() => {
                if (!pendingStatusChange) return;
                void onStatusChange(
                  pendingStatusChange.itemId,
                  pendingStatusChange.toStatus
                );
                setPendingStatusChange(null);
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
