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
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="group cursor-pointer"
            >
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
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
