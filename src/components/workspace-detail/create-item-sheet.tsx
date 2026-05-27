"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Category,
  Company,
  Component,
  DEFAULT_ITEM_STATUSES,
  ItemStatus,
  Profile,
  REPORTER_SOURCES,
  Status,
  WorkspaceMember,
} from "@/lib/types";

interface CreateItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  categories: Category[];
  components: Component[];
  statuses: Status[];
  companies: Company[];
  members: (WorkspaceMember & { profile: Profile | null })[];
  defaultOwnerCompanyId: string | null;
  onCreated: () => void;
}

export function CreateItemSheet({
  open,
  onOpenChange,
  workspaceId,
  categories,
  components,
  statuses,
  companies,
  members,
  defaultOwnerCompanyId,
  onCreated,
}: CreateItemSheetProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [componentId, setComponentId] = useState<string>("");
  const [ownerCompanyId, setOwnerCompanyId] = useState<string>("none");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterSource, setReporterSource] =
    useState<(typeof REPORTER_SOURCES)[number]>("Client");
  const [status, setStatus] = useState<ItemStatus>(statuses[0]?.name ?? "New");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const statusOptions = useMemo(
    () =>
      statuses.length
        ? statuses
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((entry) => entry.name)
        : DEFAULT_ITEM_STATUSES,
    [statuses]
  );

  useEffect(() => {
    if (open) {
      setOwnerCompanyId(defaultOwnerCompanyId ?? "none");
      setStatus(statusOptions[0] ?? "New");
    }
  }, [open, defaultOwnerCompanyId, statusOptions]);

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
        component_id: componentId || null,
        owner_company_id: ownerCompanyId === "none" ? null : ownerCompanyId,
        reporter_name: reporterName.trim() || null,
        reporter_email: reporterEmail.trim().toLowerCase() || null,
        reporter_source: reporterSource || null,
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
    setComponentId("");
    setOwnerCompanyId(defaultOwnerCompanyId ?? "none");
    setReporterName("");
    setReporterEmail("");
    setReporterSource("Client");
    setStatus(statusOptions[0] ?? "New");
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
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Component</Label>
              <Select value={componentId} onValueChange={(v) => setComponentId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((component) => (
                    <SelectItem key={component.id} value={component.id}>
                      {component.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner company</Label>
              <Select value={ownerCompanyId} onValueChange={(v) => setOwnerCompanyId(v ?? "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="Use workspace default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Use workspace default</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
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
            <div className="space-y-2">
              <Label htmlFor="reporter-name">Reporter name</Label>
              <Input
                id="reporter-name"
                placeholder="Client name"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporter-email">Reporter email</Label>
              <Input
                id="reporter-email"
                type="email"
                placeholder="reporter@company.com"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reporter source</Label>
              <Select value={reporterSource} onValueChange={(v) => setReporterSource((v as (typeof REPORTER_SOURCES)[number]) ?? "Client")}>
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
