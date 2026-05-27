"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { DEFAULT_ITEM_STATUSES } from "@/lib/types";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (wsError || !workspace) {
      setError(wsError?.message ?? "Failed to create workspace");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "admin" });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    const { data: defaultCompany } = await supabase
      .from("companies")
      .insert({
        workspace_id: workspace.id,
        name: `${name.trim()} Team`,
      })
      .select()
      .single();

    if (defaultCompany?.id) {
      await supabase
        .from("workspaces")
        .update({ default_owner_company_id: defaultCompany.id })
        .eq("id", workspace.id);

      await supabase
        .from("workspace_members")
        .update({ company_id: defaultCompany.id })
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
    }

    await supabase.from("categories").insert([
      { workspace_id: workspace.id, name: "Bugs", color: "#ef4444" },
      { workspace_id: workspace.id, name: "Feedback", color: "#3b82f6" },
      { workspace_id: workspace.id, name: "Features", color: "#10b981" },
    ]);

    await supabase.from("components").insert([
      { workspace_id: workspace.id, name: "Frontend" },
      { workspace_id: workspace.id, name: "Backend" },
    ]);

    await supabase.from("statuses").insert(
      DEFAULT_ITEM_STATUSES.map((statusName, index) => ({
        workspace_id: workspace.id,
        name: statusName,
        sort_order: index + 1,
      }))
    );

    setName("");
    onOpenChange(false);
    router.push(`/workspaces/${workspace.id}`);
    router.refresh();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-zinc-800/95 backdrop-blur-md sm:max-w-md">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace for you and your client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
