export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          created_by?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          status:
            | "New"
            | "Acknowledged"
            | "In progress"
            | "Blocked"
            | "Fixed"
            | "Verified"
            | "Closed";
          assignee_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          category_id?: string | null;
          status?:
            | "New"
            | "Acknowledged"
            | "In progress"
            | "Blocked"
            | "Fixed"
            | "Verified"
            | "Closed";
          assignee_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          status?:
            | "New"
            | "Acknowledged"
            | "In progress"
            | "Blocked"
            | "Fixed"
            | "Verified"
            | "Closed";
          assignee_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          item_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          item_id: string;
          user_id: string;
          action_type: "created" | "status_change" | "category_change" | "assignee_change";
          from_value: string | null;
          to_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          action_type: "created" | "status_change" | "category_change" | "assignee_change";
          from_value?: string | null;
          to_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          user_id?: string;
          action_type?: "created" | "status_change" | "category_change" | "assignee_change";
          from_value?: string | null;
          to_value?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
