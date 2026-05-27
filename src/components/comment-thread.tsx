"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThreadEntry } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface CommentThreadProps {
  thread: ThreadEntry[];
  onAddComment: (body: string) => void;
}

export function CommentThread({ thread, onAddComment }: CommentThreadProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await onAddComment(body.trim());
    setBody("");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-medium text-muted-foreground">Activity</label>
      <div className="space-y-4">
        {thread.map((entry) => {
          if (entry.type === "comment") {
            const c = entry.data;
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-6 w-6 text-[10px]">
                  <AvatarFallback>
                    {c.author?.full_name?.charAt(0) ?? c.author?.email?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {c.author?.full_name ?? c.author?.email ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            );
          }

          const a = entry.data;
          let message = "";
          switch (a.action_type) {
            case "created":
              message = `created this item`;
              break;
            case "title_change":
              message = `updated title from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
            case "description_change":
              message = `updated description`;
              break;
            case "status_change":
              message = `changed status from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
            case "category_change":
              message = `changed category from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
            case "component_change":
              message = `changed menu component from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
            case "owner_company_change":
              message = `changed owner company from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
            case "reporter_update":
              message = `updated reporter details`;
              break;
            case "assignee_change":
              message = `changed assignee from ${a.from_value ?? "—"} → ${a.to_value ?? "—"}`;
              break;
          }

          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <span className="text-[10px]">•</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {a.author?.full_name ?? a.author?.email ?? "Unknown"}
                  </span>{" "}
                  {message}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="text-sm resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
