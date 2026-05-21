import { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

export type ItemStatus = Item["status"];

export interface WorkspaceWithMemberCount extends Workspace {
  member_count?: number;
  user_role?: "admin" | "member";
}

export interface ItemWithDetails extends Item {
  category?: Category | null;
  assignee?: Profile | null;
  creator?: Profile | null;
}

export interface CommentWithAuthor extends Comment {
  author?: Profile | null;
}

export interface ActivityLogWithAuthor extends ActivityLog {
  author?: Profile | null;
}

export type ThreadEntry =
  | { type: "comment"; data: CommentWithAuthor }
  | { type: "activity"; data: ActivityLogWithAuthor };

export const ITEM_STATUSES: ItemStatus[] = [
  "New",
  "Acknowledged",
  "In progress",
  "Blocked",
  "Fixed",
  "Verified",
  "Closed",
];

export const STATUS_COLORS: Record<ItemStatus, string> = {
  New: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  Acknowledged: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "In progress": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Blocked: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Fixed: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Verified: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const CATEGORY_COLORS = [
  "#6b7280",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];
