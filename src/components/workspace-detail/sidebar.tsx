"use client";

import { useEffect, useState } from "react";
import { Plus, X, Pencil, Check, FolderPlus, Boxes, UserPlus, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, CATEGORY_COLORS, Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SidebarProps {
  workspaceId: string;
  categories: Category[];
  activeCategory: string | "all";
  onCategoryChange: (id: string | "all") => void;
  onCategoriesChange: () => void;
  userRole: "admin" | "member";
  onNewItem: () => void;
  onNewCategory: () => void;
  onNewComponent: () => void;
  onNewStatus: () => void;
  onInvite: () => void;
  companies: Company[];
  defaultOwnerCompanyId: string | null;
  onDefaultOwnerChange: (value: string) => void;
  addCategoryRequestId?: number;
  showHeaderAddButton?: boolean;
}

export function Sidebar({
  workspaceId,
  categories,
  activeCategory,
  onCategoryChange,
  onCategoriesChange,
  userRole,
  onNewItem,
  onNewCategory,
  onNewComponent,
  onNewStatus,
  onInvite,
  companies,
  defaultOwnerCompanyId,
  onDefaultOwnerChange,
  addCategoryRequestId = 0,
  showHeaderAddButton = true,
}: SidebarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !newName.trim()) return;
    const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
    await supabase.from("categories").insert({
      workspace_id: workspaceId,
      name: newName.trim(),
      color,
    });
    setNewName("");
    setAdding(false);
    onCategoriesChange();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from("categories").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    onCategoriesChange();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    onCategoriesChange();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    if (userRole === "admin" && addCategoryRequestId > 0) {
      setAdding(true);
    }
  }, [addCategoryRequestId, userRole]);

  return (
    <div className="flex w-60 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </span>
        {userRole === "admin" && showHeaderAddButton && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="space-y-2 px-2 pb-3">
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-8 w-full justify-start text-xs"
            onClick={onInvite}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full justify-start text-xs"
          onClick={onNewItem}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New item
        </Button>
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full justify-start text-xs"
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
            className="h-8 w-full justify-start text-xs"
            onClick={onNewComponent}
          >
            <Boxes className="mr-1.5 h-3.5 w-3.5" />
            New component
          </Button>
        )}
        {userRole === "admin" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full justify-start text-xs"
            onClick={onNewStatus}
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            New status
          </Button>
        )}
        {userRole === "admin" && (
          <Select
            value={defaultOwnerCompanyId ?? "none"}
            onValueChange={(value) => onDefaultOwnerChange(value ?? "none")}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Default owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default owner: none</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5">
          {categories.map((cat) => (
            <div key={cat.id} className="group flex items-center gap-1">
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-1 px-2 py-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="h-6 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleUpdate(cat.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      activeCategory === cat.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </button>
                  {userRole === "admin" && (
                    <div className="flex opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {adding && (
            <div className="px-2 py-1">
              <Input
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAdd}
                onBlur={() => {
                  if (!newName.trim()) setAdding(false);
                }}
                autoFocus
                className="h-7 text-sm"
              />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="px-2 py-3">
        <Button
          size="sm"
          variant="destructive"
          className="h-8 w-full justify-start text-xs"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}
