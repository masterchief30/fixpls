"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceWithMemberCount } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface WorkspacesListProps {
  workspaces: WorkspaceWithMemberCount[];
}

export function WorkspacesList({ workspaces }: WorkspacesListProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmWorkspace, setConfirmWorkspace] = useState<WorkspaceWithMemberCount | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleDeleteWorkspace = async () => {
    if (!confirmWorkspace) return;
    if (confirmText !== "DELETE") {
      setConfirmError("Type DELETE exactly to confirm.");
      return;
    }
    setDeletingId(confirmWorkspace.id);
    setError(null);
    setConfirmError(null);

    const { error: deleteError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", confirmWorkspace.id);

    if (deleteError) {
      setError(deleteError.message);
      setConfirmError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setConfirmWorkspace(null);
    setConfirmText("");
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Workspaces
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage feedback and bugs with your clients.
          </p>
        </div>
        <Button size="sm" className="h-9 px-3" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New workspace
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-800/40 py-20">
          <p className="text-sm text-zinc-400">No workspaces yet.</p>
          <Button
            variant="link"
            className="mt-2 cursor-pointer text-zinc-200 hover:text-white"
            onClick={() => setOpen(true)}
          >
            Create your first workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <div key={ws.id} className="group">
              <Link href={`/workspaces/${ws.id}`} className="block cursor-pointer">
                <Card className="h-full border-white/10 bg-zinc-800/55 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:border-white/20 group-hover:bg-zinc-800/75 group-hover:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">
                      {ws.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs capitalize text-zinc-400">
                      {ws.user_role}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              {ws.user_role === "admin" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-2 h-8 px-2"
                  onClick={() => {
                    setConfirmWorkspace(ws);
                    setConfirmText("");
                    setConfirmError(null);
                  }}
                  disabled={deletingId === ws.id}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  {deletingId === ws.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />

      <Dialog
        open={!!confirmWorkspace}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setConfirmWorkspace(null);
            setConfirmText("");
            setConfirmError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete workspace</DialogTitle>
            <DialogDescription>
              {confirmWorkspace
                ? `Delete "${confirmWorkspace.name}" permanently.`
                : "Delete workspace permanently."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <Label htmlFor="confirm-delete">Confirmation</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            {confirmError && <p className="text-sm text-red-500">{confirmError}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmWorkspace(null);
                setConfirmText("");
                setConfirmError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={
                !confirmWorkspace ||
                confirmText !== "DELETE" ||
                deletingId === confirmWorkspace.id
              }
            >
              {confirmWorkspace && deletingId === confirmWorkspace.id
                ? "Deleting..."
                : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
