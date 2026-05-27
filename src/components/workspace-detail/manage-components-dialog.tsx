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
import { Component } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface ManageComponentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  components: Component[];
  onChanged: () => void;
}

export function ManageComponentsDialog({
  open,
  onOpenChange,
  workspaceId,
  components,
  onChanged,
}: ManageComponentsDialogProps) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const { error: addError } = await supabase.from("components").insert({
      workspace_id: workspaceId,
      name: name.trim(),
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

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("components")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage components</DialogTitle>
          <DialogDescription>
            Components are used to classify ownership areas on issues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="component-name">New component</Label>
            <div className="flex gap-2">
              <Input
                id="component-name"
                placeholder="Frontend"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" disabled={loading || !name.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
            {components.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">
                No components yet.
              </p>
            ) : (
              components.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span>{component.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(component.id)}
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
    </Dialog>
  );
}
