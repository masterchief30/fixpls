"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, ItemStatus, ITEM_STATUSES, Profile, WorkspaceMember } from "@/lib/types";

interface CreateItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  categories: Category[];
  members: (WorkspaceMember & { profile: Profile | null })[];
  onCreated: () => void;
}

export function CreateItemSheet({
  open,
  onOpenChange,
  workspaceId,
  categories,
  members,
  onCreated,
}: CreateItemSheetProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<ItemStatus>("New");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: item, error } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        status,
        assignee_id: assigneeId || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !item) {
      setLoading(false);
      return;
    }

    await supabase.from("activity_log").insert({
      item_id: item.id,
      user_id: user.id,
      action_type: "created",
      to_value: title.trim(),
    });

    setTitle("");
    setDescription("");
    setCategoryId("");
    setStatus("New");
    setAssigneeId("");
    setLoading(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>New item</SheetTitle>
            <SheetDescription>Create a new bug, feedback, or feature request.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                placeholder="Short summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Details, steps to reproduce, context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus((v as ItemStatus) ?? "New")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create item"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
