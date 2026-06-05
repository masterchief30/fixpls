"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ItemWithDetails,
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
  onCreated: (createdItem?: ItemWithDetails) => void | Promise<void>;
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
  onCreated,
}: CreateItemSheetProps) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [componentIds, setComponentIds] = useState<string[]>([]);
  const [ownerCompanyIds, setOwnerCompanyIds] = useState<string[]>([]);
  const [reporterName, setReporterName] = useState("");
  const [reporterSource, setReporterSource] =
    useState<(typeof REPORTER_SOURCES)[number]>("Client");
  const [status, setStatus] = useState<ItemStatus>(statuses[0]?.name ?? "New");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showComponentOptions, setShowComponentOptions] = useState(false);
  const [showOwnerOptions, setShowOwnerOptions] = useState(false);
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
  const uniqueMembers = useMemo(
    () =>
      members.filter(
        (member, index, all) =>
          all.findIndex((candidate) => candidate.user_id === member.user_id) === index
      ),
    [members]
  );
  const preferredOwnerCompanyId = useMemo(() => {
    const fundFlow = companies.find(
      (company) => company.name.trim().toLowerCase() === "fundflow"
    );
    if (fundFlow) return fundFlow.id;
    return companies[0]?.id ?? "none";
  }, [companies]);
  const selectedCategoryLabel =
    categoryId === "none"
      ? "None"
      : categories.find((category) => category.id === categoryId)?.name ?? "None";
  const selectedComponentsLabel = useMemo(() => {
    if (componentIds.length === 0) return "None";
    const names = componentIds
      .map((id) => components.find((component) => component.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) return "None";
    if (names.length <= 2) return names.join(", ");
    return `${names.length} selected`;
  }, [componentIds, components]);
  const selectedOwnersLabel = useMemo(() => {
    if (ownerCompanyIds.length === 0) return "None";
    const names = ownerCompanyIds
      .map((id) => companies.find((company) => company.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) return "None";
    if (names.length <= 2) return names.join(", ");
    return `${names.length} selected`;
  }, [ownerCompanyIds, companies]);
  const selectedAssigneeLabel =
    assigneeId === "none"
      ? "Unassigned"
      : uniqueMembers.find((member) => member.user_id === assigneeId)?.profile?.full_name ??
        uniqueMembers.find((member) => member.user_id === assigneeId)?.profile?.email ??
        "Workspace member";

  useEffect(() => {
    const hydrateDefaults = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const fallbackName =
        profile?.full_name ??
        user.user_metadata?.full_name ??
        profile?.email?.split("@")[0] ??
        user.email?.split("@")[0] ??
        "";
      setReporterName(fallbackName);
    };

    if (open) {
      setOwnerCompanyIds(preferredOwnerCompanyId === "none" ? [] : [preferredOwnerCompanyId]);
      setStatus(statusOptions[0] ?? "New");
      setCategoryId("none");
      setComponentIds([]);
      setSubmitError(null);
      setShowComponentOptions(false);
      setShowOwnerOptions(false);
      hydrateDefaults();

      // Pre-select the logged-in user as assignee
      supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
        if (data.user) {
          const match = members.find((m) => m.user_id === data.user!.id);
          setAssigneeId(match ? match.user_id : "none");
        }
      });
    }
  }, [open, preferredOwnerCompanyId, statusOptions, supabase, members]);

  useEffect(() => {
    if (categoryId !== "none" && !categories.some((category) => category.id === categoryId)) {
      setCategoryId("none");
    }
  }, [categoryId, categories]);

  useEffect(() => {
    const validComponentIds = new Set(components.map((component) => component.id));
    setComponentIds((previous) => previous.filter((id) => validComponentIds.has(id)));
  }, [components]);

  useEffect(() => {
    const validCompanyIds = new Set(companies.map((company) => company.id));
    setOwnerCompanyIds((previous) => {
      const filtered = previous.filter((id) => validCompanyIds.has(id));
      if (filtered.length > 0) return filtered;
      if (preferredOwnerCompanyId === "none") return [];
      return validCompanyIds.has(preferredOwnerCompanyId) ? [preferredOwnerCompanyId] : [];
    });
  }, [companies, preferredOwnerCompanyId]);

  useEffect(() => {
    if (
      assigneeId !== "none" &&
      !uniqueMembers.some((member) => member.user_id === assigneeId)
    ) {
      setAssigneeId("none");
    }
  }, [assigneeId, uniqueMembers]);

  const toggleComponentId = (componentId: string) => {
    setComponentIds((previous) => {
      if (previous.includes(componentId)) {
        return previous.filter((id) => id !== componentId);
      }
      return [...previous, componentId];
    });
  };

  const toggleOwnerCompanyId = (companyId: string) => {
    setOwnerCompanyIds((previous) => {
      if (previous.includes(companyId)) {
        return previous.filter((id) => id !== companyId);
      }
      return [...previous, companyId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setSubmitError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("Not authenticated.");
      setLoading(false);
      return;
    }

    const validComponentIds = new Set(components.map((component) => component.id));
    const validOwnerCompanyIds = new Set(companies.map((company) => company.id));
    const selectedComponentIds = componentIds.filter((id) => validComponentIds.has(id));
    const selectedOwnerCompanyIds = ownerCompanyIds.filter((id) => validOwnerCompanyIds.has(id));
    const primaryComponentId = selectedComponentIds[0] ?? null;
    const primaryOwnerCompanyId = selectedOwnerCompanyIds[0] ?? null;

    const { data: item, error } = await supabase
      .from("items")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId === "none" ? null : categoryId,
        component_id: primaryComponentId,
        owner_company_id: primaryOwnerCompanyId,
        reporter_name: reporterName.trim() || null,
        reporter_email: null,
        reporter_source: reporterSource || null,
        status,
        assignee_id: assigneeId === "none" ? null : assigneeId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !item) {
      setSubmitError(error?.message ?? "Could not create item.");
      setLoading(false);
      return;
    }

    const createdItem: ItemWithDetails = {
      ...(item as ItemWithDetails),
      category:
        categories.find((category) => category.id === item.category_id) ?? null,
      component:
        components.find((component) => component.id === item.component_id) ?? null,
      owner_company:
        companies.find((company) => company.id === item.owner_company_id) ?? null,
      assignee:
        uniqueMembers.find((member) => member.user_id === item.assignee_id)?.profile ??
        null,
      creator:
        uniqueMembers.find((member) => member.user_id === item.created_by)?.profile ??
        null,
    };

    if (selectedComponentIds.length > 0) {
      const { error: componentLinksError } = await supabase
        .from("item_component_links")
        .upsert(
          selectedComponentIds.map((id) => ({
            item_id: item.id,
            workspace_id: workspaceId,
            component_id: id,
          })),
          { onConflict: "item_id,component_id" }
        );
      if (componentLinksError) {
        console.error("Item component links failed:", componentLinksError.message);
      }
    }

    if (selectedOwnerCompanyIds.length > 0) {
      const { error: ownerLinksError } = await supabase
        .from("item_owner_company_links")
        .upsert(
          selectedOwnerCompanyIds.map((id) => ({
            item_id: item.id,
            workspace_id: workspaceId,
            company_id: id,
          })),
          { onConflict: "item_id,company_id" }
        );
      if (ownerLinksError) {
        console.error("Item owner links failed:", ownerLinksError.message);
      }
    }

    await supabase.from("activity_log").insert({
      item_id: item.id,
      user_id: user.id,
      action_type: "created",
      to_value: title.trim(),
    });

    setTitle("");
    setDescription("");
    setCategoryId("none");
    setComponentIds([]);
    setOwnerCompanyIds(preferredOwnerCompanyId === "none" ? [] : [preferredOwnerCompanyId]);
    setReporterName("");
    setReporterSource("Client");
    setStatus(statusOptions[0] ?? "New");
    setAssigneeId("none");
    setShowComponentOptions(false);
    setShowOwnerOptions(false);
    setSubmitError(null);
    setLoading(false);
    onOpenChange(false);
    await onCreated(createdItem);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New item</DialogTitle>
            <DialogDescription>Create a new bug, feedback, or feature request.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-6 pr-1">
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
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
                <SelectTrigger className="w-full">
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
              <Label>Menu Component</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setShowComponentOptions((previous) => !previous)}
              >
                <span className="truncate">{selectedComponentsLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {showComponentOptions ? "Hide" : "Select"}
                </span>
              </Button>
              {showComponentOptions && (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
                    onClick={() => setComponentIds([])}
                  >
                    <span>None</span>
                    {componentIds.length === 0 && <Check className="h-4 w-4" />}
                  </button>
                  {components.map((component) => {
                    const selected = componentIds.includes(component.id);
                    return (
                      <button
                        key={component.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
                        onClick={() => toggleComponentId(component.id)}
                      >
                        <span>{component.name}</span>
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Owner company</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setShowOwnerOptions((previous) => !previous)}
              >
                <span className="truncate">{selectedOwnersLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {showOwnerOptions ? "Hide" : "Select"}
                </span>
              </Button>
              {showOwnerOptions && (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
                    onClick={() => setOwnerCompanyIds([])}
                  >
                    <span>None</span>
                    {ownerCompanyIds.length === 0 && <Check className="h-4 w-4" />}
                  </button>
                  {companies.map((company) => {
                    const selected = ownerCompanyIds.includes(company.id);
                    return (
                      <button
                        key={company.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-muted/60"
                        onClick={() => toggleOwnerCompanyId(company.id)}
                      >
                        <span>{company.name}</span>
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v ?? "none")}>
                <SelectTrigger className="w-full">
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
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
