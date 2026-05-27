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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CommentThread } from "@/components/comment-thread";
import {
  Category,
  Company,
  Component,
  DEFAULT_ITEM_STATUSES,
  ItemStatus,
  ItemWithDetails,
  Profile,
  REPORTER_SOURCES,
  Status,
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
  components: Component[];
  statuses: Status[];
  companies: Company[];
  members: (WorkspaceMember & { profile: Profile | null })[];
  onUpdated: () => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  categories,
  components,
  statuses,
  companies,
  members,
  onUpdated,
}: ItemDetailSheetProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [activities, setActivities] = useState<ActivityLogWithAuthor[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusValue, setStatusValue] = useState<ItemStatus>("New");
  const [categoryValue, setCategoryValue] = useState<string>("none");
  const [componentValue, setComponentValue] = useState<string>("none");
  const [assigneeValue, setAssigneeValue] = useState<string>("none");
  const [ownerCompanyValue, setOwnerCompanyValue] = useState<string>("none");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterSource, setReporterSource] =
    useState<(typeof REPORTER_SOURCES)[number]>("Client");
  const uniqueMembers = useMemo(
    () =>
      members.filter(
        (member, index, all) =>
          all.findIndex((candidate) => candidate.user_id === member.user_id) === index
      ),
    [members]
  );

  const thread: ThreadEntry[] = useMemo(() => {
    const entries: ThreadEntry[] = [
      ...comments.map((c) => ({ type: "comment" as const, data: c })),
      ...activities.map((a) => ({ type: "activity" as const, data: a })),
    ];
    entries.sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());
    return entries;
  }, [comments, activities]);

  const statusOptions = useMemo(() => {
    const fromWorkspace = statuses
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((entry) => entry.name);
    const base = fromWorkspace.length ? fromWorkspace : DEFAULT_ITEM_STATUSES;
    if (item?.status && !base.includes(item.status)) {
      return [item.status, ...base];
    }
    return base;
  }, [statuses, item?.status]);
  const selectedCategoryLabel =
    categoryValue === "none"
      ? "None"
      : categories.find((category) => category.id === categoryValue)?.name ?? "None";
  const selectedComponentLabel =
    componentValue === "none"
      ? "None"
      : components.find((component) => component.id === componentValue)?.name ?? "None";
  const selectedOwnerLabel =
    ownerCompanyValue === "none"
      ? "None"
      : companies.find((company) => company.id === ownerCompanyValue)?.name ?? "None";
  const selectedAssigneeLabel =
    assigneeValue === "none"
      ? "Unassigned"
      : uniqueMembers.find((member) => member.user_id === assigneeValue)?.profile?.full_name ??
        uniqueMembers.find((member) => member.user_id === assigneeValue)?.profile?.email ??
        "Workspace member";

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
      setStatusValue(item.status);
      setCategoryValue(item.category_id ?? "none");
      setComponentValue(item.component_id ?? "none");
      setAssigneeValue(item.assignee_id ?? "none");
      setOwnerCompanyValue(item.owner_company_id ?? "none");
      setReporterName(item.reporter_name ?? "");
      setReporterEmail(item.reporter_email ?? "");
      setReporterSource(
        (item.reporter_source as (typeof REPORTER_SOURCES)[number]) ?? "Client"
      );
    }
  }, [item?.id, item]);

  useEffect(() => {
    if (
      categoryValue !== "none" &&
      !categories.some((category) => category.id === categoryValue)
    ) {
      setCategoryValue("none");
    }
  }, [categoryValue, categories]);

  useEffect(() => {
    if (
      componentValue !== "none" &&
      !components.some((component) => component.id === componentValue)
    ) {
      setComponentValue("none");
    }
  }, [componentValue, components]);

  useEffect(() => {
    if (
      ownerCompanyValue !== "none" &&
      !companies.some((company) => company.id === ownerCompanyValue)
    ) {
      setOwnerCompanyValue("none");
    }
  }, [ownerCompanyValue, companies]);

  useEffect(() => {
    if (
      assigneeValue !== "none" &&
      !uniqueMembers.some((member) => member.user_id === assigneeValue)
    ) {
      setAssigneeValue("none");
    }
  }, [assigneeValue, uniqueMembers]);

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
    actionType:
      | "status_change"
      | "category_change"
      | "assignee_change"
      | "title_change"
      | "description_change"
      | "owner_company_change"
      | "reporter_update"
      | "component_change",
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
    await logActivity("title_change", item.title, title);
  };

  const handleDescBlur = async () => {
    if (!item || description === (item.description ?? "")) return;
    await updateItem({ description: description || null });
    await logActivity(
      "description_change",
      item.description ?? "",
      description || ""
    );
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!item || newStatus === item.status) return;
    await updateItem({ status: newStatus });
    await logActivity("status_change", item.status, newStatus);
  };

  const handleCategoryChange = async (newCategoryId: string) => {
    if (!item) return;
    const nextCategoryId = newCategoryId === "none" ? null : newCategoryId;
    if (nextCategoryId === item.category_id) return;
    const oldName = item.category?.name ?? "None";
    const newName =
      categories.find((c) => c.id === nextCategoryId)?.name ?? "None";
    await updateItem({ category_id: nextCategoryId });
    await logActivity("category_change", oldName, newName);
  };

  const handleComponentChange = async (newComponentId: string) => {
    if (!item) return;
    const nextComponentId = newComponentId === "none" ? null : newComponentId;
    if (nextComponentId === item.component_id) return;
    const oldName = item.component?.name ?? "None";
    const newName =
      components.find((component) => component.id === nextComponentId)?.name ??
      "None";
    await updateItem({ component_id: nextComponentId });
    await logActivity("component_change", oldName, newName);
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!item) return;
    const nextAssigneeId = newAssigneeId === "none" ? null : newAssigneeId;
    if (nextAssigneeId === item.assignee_id) return;
    const oldName = item.assignee?.full_name ?? item.assignee?.email ?? "Unassigned";
    const newProfile = members.find((m) => m.user_id === nextAssigneeId)?.profile;
    const newName = newProfile?.full_name ?? newProfile?.email ?? "Unassigned";
    await updateItem({ assignee_id: nextAssigneeId });
    await logActivity("assignee_change", oldName, newName);
  };

  const handleOwnerCompanyChange = async (newOwnerCompanyId: string) => {
    if (!item) return;
    const nextOwnerCompanyId = newOwnerCompanyId === "none" ? null : newOwnerCompanyId;
    if (nextOwnerCompanyId === item.owner_company_id) return;
    const oldName = item.owner_company?.name ?? "None";
    const newName =
      newOwnerCompanyId === "none"
        ? "None"
        : companies.find((company) => company.id === newOwnerCompanyId)?.name ?? "None";
    await updateItem({
      owner_company_id: nextOwnerCompanyId,
    });
    await logActivity("owner_company_change", oldName, newName);
  };

  const handleReporterSave = async (
    next: {
      name?: string;
      email?: string;
      source?: (typeof REPORTER_SOURCES)[number];
    } = {}
  ) => {
    if (!item) return;
    const nextName = (next.name ?? reporterName).trim() || null;
    const nextEmail = (next.email ?? reporterEmail).trim().toLowerCase() || null;
    const nextSource = next.source ?? reporterSource;
    const hasChanges =
      nextName !== (item.reporter_name ?? null) ||
      nextEmail !== (item.reporter_email ?? null) ||
      nextSource !== (item.reporter_source ?? null);
    if (!hasChanges) return;

    const oldReporter = [
      item.reporter_name ?? "—",
      item.reporter_email ?? "—",
      item.reporter_source ?? "—",
    ].join(" | ");
    const newReporter = [nextName ?? "—", nextEmail ?? "—", nextSource ?? "—"].join(
      " | "
    );

    await updateItem({
      reporter_name: nextName,
      reporter_email: nextEmail,
      reporter_source: nextSource,
    });
    await logActivity("reporter_update", oldReporter, newReporter);
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
                <Select
                  value={statusValue}
                  onValueChange={(v) => {
                    const value = (v as ItemStatus) ?? "New";
                    setStatusValue(value);
                    handleStatusChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Category</span>
                <Select
                  value={categoryValue}
                  onValueChange={(v) => {
                    const value = v ?? "none";
                    setCategoryValue(value);
                    handleCategoryChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <span className="truncate">{selectedCategoryLabel}</span>
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
                <span className="text-xs text-muted-foreground">Menu Component</span>
                <Select
                  value={componentValue}
                  onValueChange={(v) => {
                    const value = v ?? "none";
                    setComponentValue(value);
                    handleComponentChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <span className="truncate">{selectedComponentLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {components.map((component) => (
                      <SelectItem key={component.id} value={component.id}>
                        {component.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Assignee</span>
                <Select
                  value={assigneeValue}
                  onValueChange={(v) => {
                    const value = v ?? "none";
                    setAssigneeValue(value);
                    handleAssigneeChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <span className="truncate">{selectedAssigneeLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {uniqueMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name ?? m.profile?.email ?? "Workspace member"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Owner</span>
                <Select
                  value={ownerCompanyValue}
                  onValueChange={(v) => {
                    const value = v ?? "none";
                    setOwnerCompanyValue(value);
                    handleOwnerCompanyChange(value);
                  }}
                >
                  <SelectTrigger className="h-7 w-44 text-xs">
                    <span className="truncate">{selectedOwnerLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
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

            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-xs text-muted-foreground">Reporter</Label>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  onBlur={() => handleReporterSave()}
                  placeholder="Reporter name"
                />
                <Input
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  onBlur={() => handleReporterSave()}
                  placeholder="Reporter email"
                  type="email"
                />
                <Select
                  value={reporterSource}
                  onValueChange={(v) => {
                    const value = (v as (typeof REPORTER_SOURCES)[number]) ?? "Client";
                    setReporterSource(value);
                    handleReporterSave({ source: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORTER_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
