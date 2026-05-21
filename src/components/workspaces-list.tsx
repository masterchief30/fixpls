"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { WorkspaceWithMemberCount } from "@/lib/types";

interface WorkspacesListProps {
  workspaces: WorkspaceWithMemberCount[];
}

export function WorkspacesList({ workspaces }: WorkspacesListProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Workspaces</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
          <Button variant="link" onClick={() => setOpen(true)}>
            Create your first workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspaces/${ws.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{ws.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ws.user_role}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
