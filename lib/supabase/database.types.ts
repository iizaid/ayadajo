export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          full_name: string;
          phone: string | null;
          is_platform_admin: boolean;
          mfa_enabled: boolean;
          platform_role: "super_admin" | "support_admin" | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          is_platform_admin?: boolean;
          mfa_enabled?: boolean;
          platform_role?: "super_admin" | "support_admin" | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          is_platform_admin?: boolean;
          mfa_enabled?: boolean;
          platform_role?: "super_admin" | "support_admin" | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      plans: {
        Row: {
          id: string;
          code: string;
          name: string;
          price: string;
          interval: "month" | "year" | "custom";
          max_staff: number | null;
          max_messages_month: number | null;
          storage_mb: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          price?: string;
          interval: "month" | "year" | "custom";
          max_staff?: number | null;
          max_messages_month?: number | null;
          storage_mb?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          price?: string;
          interval?: "month" | "year" | "custom";
          max_staff?: number | null;
          max_messages_month?: number | null;
          storage_mb?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
