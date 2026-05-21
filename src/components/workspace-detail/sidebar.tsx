"use client";

import { useState } from "react";
import { Plus, X, Pencil, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Category, CATEGORY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaceId: string;
  categories: Category[];
  activeCategory: string | "all";
  onCategoryChange: (id: string | "all") => void;
  onCategoriesChange: () => void;
  userRole: "admin" | "member";
}

export function Sidebar({
  workspaceId,
  categories,
  activeCategory,
  onCategoryChange,
  onCategoriesChange,
  userRole,
}: SidebarProps) {
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  return (
    <div className="flex w-60 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </span>
        {userRole === "admin" && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5">
          <button
            onClick={() => onCategoryChange("all")}
            className={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors",
              activeCategory === "all"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            All items
          </button>
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
    </div>
  );
}
