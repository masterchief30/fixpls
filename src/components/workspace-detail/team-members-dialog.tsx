"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Profile, WorkspaceMember } from "@/lib/types";

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: (WorkspaceMember & { profile: Profile | null })[];
}

export function TeamMembersDialog({
  open,
  onOpenChange,
  members,
}: TeamMembersDialogProps) {
  const uniqueMembers = useMemo(
    () =>
      members.filter(
        (member, index, all) =>
          all.findIndex((candidate) => candidate.user_id === member.user_id) === index
      ),
    [members]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
          <DialogDescription>
            People currently in this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-2">
          {uniqueMembers.length === 0 ? (
            <p className="px-2 py-1 text-sm text-muted-foreground">No members found.</p>
          ) : (
            uniqueMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded px-2 py-1.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.profile?.full_name ?? member.profile?.email ?? "Workspace member"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.profile?.email ?? member.user_id}
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-xs capitalize text-muted-foreground">
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
