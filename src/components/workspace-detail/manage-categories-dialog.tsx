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
import { Category, CATEGORY_COLORS } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  categories: Category[];
  onChanged: () => void;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  workspaceId,
  categories,
  onChanged,
}: ManageCategoriesDialogProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const resolveNextCategoryColor = () => {
    const usedColors = new Set(categories.map((category) => category.color));
    const availableColor = CATEGORY_COLORS.find((color) => !usedColors.has(color));
    if (availableColor) return availableColor;
    return CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const color = resolveNextCategoryColor();
    const { error: addError } = await supabase.from("categories").insert({
      workspace_id: workspaceId,
      name: name.trim(),
      color,
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

    const { error: deleteError } = await supabase
      .from("categories")
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
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Current categories in this workspace are listed below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category-name">New category</Label>
            <div className="flex gap-2">
              <Input
                id="category-name"
                placeholder="Bugs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" disabled={loading || !name.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
            {categories.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">
                No categories yet.
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setDeleteTarget(category);
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
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Delete "${deleteTarget.name}" permanently.`
                : "Delete category permanently."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <Label htmlFor="confirm-delete-category">Confirmation</Label>
            <Input
              id="confirm-delete-category"
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
              {deleteLoading ? "Deleting..." : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
