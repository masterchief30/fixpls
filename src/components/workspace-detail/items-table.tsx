"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  onReorder?: (itemId: string, direction: "up" | "down") => void | Promise<void>;
}

export function ItemsTable({
  items,
  statusOptions,
  onItemClick,
  onStatusChange,
  onReorder,
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
    const name = item.creator.full_name;
    if (name) return name.split(" ")[0];
    const email = item.creator.email;
    if (email) return email.split("@")[0];
    return "—";
  };

  const normalizeStatus = (status: string) => status.trim().toLowerCase();
  const isClosed = (status: string) => normalizeStatus(status) === "closed";

  const padNumber = (n: number) => String(n).padStart(3, "0");

  const getStatusSelectClass = (status: string) => {
    switch (normalizeStatus(status)) {
      case "fixed":
        return "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
      case "new":
        return "border-sky-500/50 bg-sky-500/10 text-sky-300";
      case "in progress":
        return "border-amber-500/50 bg-amber-500/10 text-amber-300";
      case "delayed":
      case "delazed":
        return "border-orange-500/50 bg-orange-500/10 text-orange-300";
      case "blocked":
        return "border-rose-500/50 bg-rose-500/10 text-rose-300";
      case "closed":
        return "border-slate-600/40 bg-slate-800/30 text-slate-500";
      default:
        return "border-slate-700/60 bg-transparent text-slate-300";
    }
  };

  const getRowHighlightClass = (status: string) => {
    switch (normalizeStatus(status)) {
      case "fixed":
        return "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]";
      case "new":
        return "bg-sky-500/[0.08] hover:bg-sky-500/[0.14]";
      case "in progress":
        return "bg-amber-500/[0.10] hover:bg-amber-500/[0.16]";
      case "delayed":
      case "delazed":
        return "bg-orange-500/[0.10] hover:bg-orange-500/[0.16]";
      case "blocked":
        return "bg-rose-500/[0.12] hover:bg-rose-500/[0.18]";
      case "closed":
        return "bg-slate-900/50 opacity-45 hover:opacity-60";
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
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead className="w-[20%]">Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Menu Component</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Status</TableHead>
            {onReorder && <TableHead className="w-16" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onReorder ? 10 : 9}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer ${getRowHighlightClass(item.status)}`}
                onClick={() => onItemClick(item.id)}
              >
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {padNumber(item.item_number ?? 0)}
                </TableCell>
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
                {onReorder && (
                  <TableCell>
                    {!isClosed(item.status) && (
                      <div
                        className="flex flex-col items-center gap-0"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="rounded p-0.5 text-slate-500 hover:bg-slate-700/50 hover:text-slate-200 disabled:opacity-30"
                          disabled={index === 0}
                          onClick={() => onReorder(item.id, "up")}
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded p-0.5 text-slate-500 hover:bg-slate-700/50 hover:text-slate-200 disabled:opacity-30"
                          disabled={
                            index === items.length - 1 ||
                            isClosed(items[index + 1]?.status ?? "")
                          }
                          onClick={() => onReorder(item.id, "down")}
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                )}
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
