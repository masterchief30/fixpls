"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { CommentThread } from "@/components/comment-thread";
import {
  Category,
  ItemStatus,
  ITEM_STATUSES,
  ItemWithDetails,
  Profile,
  WorkspaceMember,
  CommentWithAuthor,
  ActivityLogWithAuthor,
  ThreadEntry,
} from "@/lib/types";

interface ItemDetailSheetProps {
  item: ItemWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  members: (WorkspaceMember & { profile: Profile | null })[];
  onUpdated: () => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  categories,
  members,
  onUpdated,
}: ItemDetailSheetProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [activities, setActivities] = useState<ActivityLogWithAuthor[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const thread: ThreadEntry[] = useMemo(() => {
    const entries: ThreadEntry[] = [
      ...comments.map((c) => ({ type: "comment" as const, data: c })),
      ...activities.map((a) => ({ type: "activity" as const, data: a })),
    ];
    entries.sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());
    return entries;
  }, [comments, activities]);

  const fetchComments = useCallback(async () => {
    if (!item) return;
    const { data } = await supabase
      .from("comments")
      .select(`*, author:user_id (*)`)
      .eq("item_id", item.id)
      .order("created_at", { ascending: true });
    if (data) setComments(data as unknown as CommentWithAuthor[]);
  }, [supabase, item]);

  const fetchActivities = useCallback(async () => {
    if (!item) return;
    const { data } = await supabase
      .from("activity_log")
      .select(`*, author:user_id (*)`)
      .eq("item_id", item.id)
      .order("created_at", { ascending: true });
    if (data) setActivities(data as unknown as ActivityLogWithAuthor[]);
  }, [supabase, item]);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? "");
    }
  }, [item?.id]);

  useEffect(() => {
    if (item) {
      fetchComments();
      fetchActivities();
    }
  }, [item?.id, fetchComments, fetchActivities]);

  useEffect(() => {
    if (!item) return;
    const channel = supabase
      .channel(`item-${item.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `item_id=eq.${item.id}` },
        () => fetchComments()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `item_id=eq.${item.id}` },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, item, fetchComments, fetchActivities]);

  const logActivity = async (
    actionType: "status_change" | "category_change" | "assignee_change",
    from: string | null,
    to: string | null
  ) => {
    if (!item) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activity_log").insert({
      item_id: item.id,
      user_id: user.id,
      action_type: actionType,
      from_value: from,
      to_value: to,
    });
    fetchActivities();
    onUpdated();
  };

  const updateItem = async (updates: Partial<ItemWithDetails>) => {
    if (!item) return;
    await supabase.from("items").update(updates).eq("id", item.id);
    onUpdated();
  };

  const handleTitleBlur = async () => {
    if (!item || title === item.title) return;
    await updateItem({ title });
  };

  const handleDescBlur = async () => {
    if (!item || description === (item.description ?? "")) return;
    await updateItem({ description: description || null });
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!item || newStatus === item.status) return;
    await updateItem({ status: newStatus });
    await logActivity("status_change", item.status, newStatus);
  };

  const handleCategoryChange = async (newCategoryId: string) => {
    if (!item || newCategoryId === item.category_id) return;
    const oldName = item.category?.name ?? "None";
    const newName = categories.find((c) => c.id === newCategoryId)?.name ?? "None";
    await updateItem({ category_id: newCategoryId === "none" ? null : newCategoryId });
    await logActivity("category_change", oldName, newName);
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!item || newAssigneeId === item.assignee_id) return;
    const oldName = item.assignee?.full_name ?? item.assignee?.email ?? "Unassigned";
    const newProfile = members.find((m) => m.user_id === newAssigneeId)?.profile;
    const newName = newProfile?.full_name ?? newProfile?.email ?? "Unassigned";
    await updateItem({ assignee_id: newAssigneeId === "none" ? null : newAssigneeId });
    await logActivity("assignee_change", oldName, newName);
  };

  const handleAddComment = async (body: string) => {
    if (!item) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("comments").insert({
      item_id: item.id,
      user_id: user.id,
      body,
    });
    fetchComments();
  };

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="space-y-4 pb-4">
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <Select value={item.status} onValueChange={(v) => handleStatusChange((v as ItemStatus) ?? "New")}>
                  <SelectTrigger className="h-7 text-xs">
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Category</span>
                <Select value={item.category_id ?? "none"} onValueChange={(v) => handleCategoryChange(v ?? "none")}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Assignee</span>
                <Select value={item.assignee_id ?? "none"} onValueChange={(v) => handleAssigneeChange(v ?? "none")}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name ?? m.profile?.email ?? m.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description..."
                className="mt-1 min-h-[100px] resize-none text-sm"
              />
            </div>

            <CommentThread
              thread={thread}
              onAddComment={handleAddComment}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
