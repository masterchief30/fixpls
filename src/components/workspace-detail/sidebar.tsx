"use client";

import { useState } from "react";
import { Plus, FolderPlus, Boxes, UserPlus, Flag, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SidebarProps {
  userRole: "admin" | "member";
  onNewItem: () => void;
  onNewCategory: () => void;
  onNewComponent: () => void;
  onNewCompany: () => void;
  onNewStatus: () => void;
  onInvite: () => void;
}

export function Sidebar({
  userRole,
  onNewItem,
  onNewCategory,
  onNewComponent,
  onNewCompany,
  onNewStatus,
  onInvite,
}: SidebarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex w-60 flex-col border-r border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/70">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </span>
      </div>
      <div className="space-y-2 px-2 pb-3">
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-9 w-full justify-start text-sm"
            onClick={onInvite}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full justify-start text-sm"
          onClick={onNewItem}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New item
        </Button>
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start text-sm"
            onClick={onNewCategory}
          >
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
            New category
          </Button>
        )}
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start text-sm"
            onClick={onNewComponent}
          >
            <Boxes className="mr-1.5 h-3.5 w-3.5" />
            New Menu Component
          </Button>
        )}
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start text-sm"
            onClick={onNewCompany}
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5" />
            New company
          </Button>
        )}
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start text-sm"
            onClick={onNewStatus}
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            New status
          </Button>
        )}
      </div>
      <div className="flex-1" />
      <div className="px-2 py-3">
        <Button
          size="sm"
          variant="destructive"
          className="h-9 w-full justify-start text-sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}
