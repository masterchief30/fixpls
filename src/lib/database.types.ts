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
      companies: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      components: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      statuses: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      company_domains: {
        Row: {
          id: string;
          workspace_id: string;
          company_id: string;
          domain: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          company_id: string;
          domain: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          company_id?: string;
          domain?: string;
          created_at?: string;
        };
      };
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
          default_owner_company_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          created_by: string;
          default_owner_company_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          created_by?: string;
          default_owner_company_id?: string | null;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at: string;
          company_id: string | null;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at?: string;
          company_id?: string | null;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          created_at?: string;
          company_id?: string | null;
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
          component_id: string | null;
          owner_company_id: string | null;
          reporter_name: string | null;
          reporter_email: string | null;
          reporter_source: string | null;
          status: string;
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
          component_id?: string | null;
          owner_company_id?: string | null;
          reporter_name?: string | null;
          reporter_email?: string | null;
          reporter_source?: string | null;
          status?: string;
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
          component_id?: string | null;
          owner_company_id?: string | null;
          reporter_name?: string | null;
          reporter_email?: string | null;
          reporter_source?: string | null;
          status?: string;
          assignee_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      item_component_links: {
        Row: {
          item_id: string;
          workspace_id: string;
          component_id: string;
          created_at: string;
        };
        Insert: {
          item_id: string;
          workspace_id: string;
          component_id: string;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          workspace_id?: string;
          component_id?: string;
          created_at?: string;
        };
      };
      item_owner_company_links: {
        Row: {
          item_id: string;
          workspace_id: string;
          company_id: string;
          created_at: string;
        };
        Insert: {
          item_id: string;
          workspace_id: string;
          company_id: string;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          workspace_id?: string;
          company_id?: string;
          created_at?: string;
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
          action_type:
            | "created"
            | "status_change"
            | "category_change"
            | "assignee_change"
            | "title_change"
            | "description_change"
            | "owner_company_change"
            | "reporter_update"
            | "component_change";
          from_value: string | null;
          to_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          user_id: string;
          action_type:
            | "created"
            | "status_change"
            | "category_change"
            | "assignee_change"
            | "title_change"
            | "description_change"
            | "owner_company_change"
            | "reporter_update"
            | "component_change";
          from_value?: string | null;
          to_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          user_id?: string;
          action_type?:
            | "created"
            | "status_change"
            | "category_change"
            | "assignee_change"
            | "title_change"
            | "description_change"
            | "owner_company_change"
            | "reporter_update"
            | "component_change";
          from_value?: string | null;
          to_value?: string | null;
          created_at?: string;
        };
      };
      workspace_invites: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          invited_name: string | null;
          role: "admin" | "member";
          company_id: string | null;
          invited_by: string | null;
          token: string;
          expires_at: string | null;
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          invited_name?: string | null;
          role?: "admin" | "member";
          company_id?: string | null;
          invited_by?: string | null;
          token?: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          invited_name?: string | null;
          role?: "admin" | "member";
          company_id?: string | null;
          invited_by?: string | null;
          token?: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      resolve_company_for_email: {
        Args: {
          p_workspace_id: string;
          p_email: string;
        };
        Returns: string | null;
      };
    };
    Enums: {};
  };
}
