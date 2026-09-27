export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      issue_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          issue_id: string
          team: string | null
          worker_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          issue_id: string
          team?: string | null
          worker_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          issue_id?: string
          team?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_completions: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          id: string
          issue_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["completion_status"]
          submitted_at: string | null
          time_spent_minutes: number | null
          verified_at: string | null
          verified_by: string | null
          work_description: string | null
          worker_id: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          issue_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["completion_status"]
          submitted_at?: string | null
          time_spent_minutes?: number | null
          verified_at?: string | null
          verified_by?: string | null
          work_description?: string | null
          worker_id: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          issue_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["completion_status"]
          submitted_at?: string | null
          time_spent_minutes?: number | null
          verified_at?: string | null
          verified_by?: string | null
          work_description?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_completions_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_completions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_completions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_confirmations: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_confirmations_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_confirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          address: string | null
          assigned_team: string | null
          assigned_worker_id: string | null
          category: Database["public"]["Enums"]["issue_category"]
          confirmation_count: number
          created_at: string
          description: string
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          priority: Database["public"]["Enums"]["issue_priority"]
          priority_score: number
          remarks: string | null
          reported_by: string
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_team?: string | null
          assigned_worker_id?: string | null
          category: Database["public"]["Enums"]["issue_category"]
          confirmation_count?: number
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          priority_score?: number
          remarks?: string | null
          reported_by: string
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_team?: string | null
          assigned_worker_id?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          confirmation_count?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          priority_score?: number
          remarks?: string | null
          reported_by?: string
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          team: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          team?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          team?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      category_severity: {
        Args: { _category: Database["public"]["Enums"]["issue_category"] }
        Returns: number
      }
      civic_priority: {
        Args: { _score: number }
        Returns: Database["public"]["Enums"]["issue_priority"]
      }
      civic_priority_score: {
        Args: {
          _category: Database["public"]["Enums"]["issue_category"]
          _confirmations: number
          _created_at: string
        }
        Returns: number
      }
      find_nearby_issues: {
        Args: {
          _category: Database["public"]["Enums"]["issue_category"]
          _lat: number
          _lng: number
          _radius_m?: number
        }
        Returns: {
          category: Database["public"]["Enums"]["issue_category"]
          confirmation_count: number
          created_at: string
          distance_m: number
          id: string
          priority: Database["public"]["Enums"]["issue_priority"]
          status: Database["public"]["Enums"]["issue_status"]
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      persistence_points: { Args: { _created_at: string }; Returns: number }
    }
    Enums: {
      app_role: "CITIZEN" | "FIELD_WORKER" | "ADMIN"
      completion_status: "SUBMITTED" | "VERIFIED" | "REWORK_REQUESTED"
      issue_category:
        | "Pothole"
        | "Streetlight"
        | "Garbage"
        | "Water Leakage"
        | "Drainage"
        | "Road Damage"
        | "Other"
      issue_priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      issue_status:
        | "REPORTED"
        | "VERIFIED"
        | "ASSIGNED"
        | "IN_PROGRESS"
        | "COMPLETION_SUBMITTED"
        | "RESOLVED"
        | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["CITIZEN", "FIELD_WORKER", "ADMIN"],
      completion_status: ["SUBMITTED", "VERIFIED", "REWORK_REQUESTED"],
      issue_category: [
        "Pothole",
        "Streetlight",
        "Garbage",
        "Water Leakage",
        "Drainage",
        "Road Damage",
        "Other",
      ],
      issue_priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      issue_status: [
        "REPORTED",
        "VERIFIED",
        "ASSIGNED",
        "IN_PROGRESS",
        "COMPLETION_SUBMITTED",
        "RESOLVED",
        "REJECTED",
      ],
    },
  },
} as const
