"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Status } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface ManageStatusesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  statuses: Status[];
  onChanged: () => void;
}

export function ManageStatusesDialog({
  open,
  onOpenChange,
  workspaceId,
  statuses,
  onChanged,
}: ManageStatusesDialogProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Status | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const nextSortOrder =
      statuses.length === 0
        ? 1
        : Math.max(...statuses.map((status) => status.sort_order ?? 0)) + 1;

    const { error: addError } = await supabase.from("statuses").insert({
      workspace_id: workspaceId,
      name: name.trim(),
      sort_order: nextSortOrder,
    });

    if (addError) {
      setError(addError.message);
      setLoading(false);
      return;
    }

    setName("");
    setLoading(false);
    onChanged();
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setConfirmText("");
    setConfirmError(null);
    setDeleteLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (confirmText !== "DELETE") {
      setConfirmError("Type DELETE exactly to confirm.");
      return;
    }
    setDeleteLoading(true);
    setConfirmError(null);
    setError(null);

    if (statuses.length <= 1) {
      const message = "At least one status must remain.";
      setError(message);
      setConfirmError(message);
      setDeleteLoading(false);
      return;
    }

    const { count, error: countError } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", deleteTarget.name);

    if (countError) {
      setError(countError.message);
      setConfirmError(countError.message);
      setDeleteLoading(false);
      return;
    }

    if ((count ?? 0) > 0) {
      const message = `Cannot delete "${deleteTarget.name}" because it is used by existing items.`;
      setError(message);
      setConfirmError(message);
      setDeleteLoading(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("statuses")
      .delete()
      .eq("id", deleteTarget.id);

    if (deleteError) {
      setError(deleteError.message);
      setConfirmError(deleteError.message);
      setDeleteLoading(false);
      return;
    }

    closeDeleteDialog();
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage statuses</DialogTitle>
          <DialogDescription>
            Add custom workflow states for this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="status-name">New status</Label>
            <div className="flex gap-2">
              <Input
                id="status-name"
                placeholder="Waiting for client"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" disabled={loading || !name.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
            {statuses.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">No statuses yet.</p>
            ) : (
              statuses
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm"
                  >
                    <span>{status.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setDeleteTarget(status);
                        setConfirmText("");
                        setConfirmError(null);
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeDeleteDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete status</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Delete "${deleteTarget.name}" permanently.`
                : "Delete status permanently."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <Label htmlFor="confirm-delete-status">Confirmation</Label>
            <Input
              id="confirm-delete-status"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            {confirmError && <p className="text-sm text-red-500">{confirmError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!deleteTarget || confirmText !== "DELETE" || deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
