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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number
          bank_name: string | null
          bill_date: number | null
          color: string | null
          created_at: string
          credit_limit: number | null
          credit_used: number | null
          due_date: number | null
          icon: string | null
          id: string
          is_credit_card: boolean | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          bill_date?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_used?: number | null
          due_date?: number | null
          icon?: string | null
          id?: string
          is_credit_card?: boolean | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          bank_name?: string | null
          bill_date?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          credit_used?: number | null
          due_date?: number | null
          icon?: string | null
          id?: string
          is_credit_card?: boolean | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget: {
        Row: {
          created_at: string
          current_spent: number
          id: string
          month: number
          monthly_limit: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          current_spent?: number
          id?: string
          month: number
          monthly_limit?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          current_spent?: number
          id?: string
          month?: number
          monthly_limit?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      category_budgets: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string | null
          id: string
          month: number
          percentage: number
          spent_amount: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          allocated_amount?: number
          category: string
          created_at?: string | null
          id?: string
          month: number
          percentage?: number
          spent_amount?: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string | null
          id?: string
          month?: number
          percentage?: number
          spent_amount?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          default_account_id: string | null
          default_currency: string | null
          email: string | null
          email_notifications: boolean | null
          id: string
          notification_bills: boolean | null
          notification_budget_alerts: boolean | null
          notification_expenses: boolean | null
          notification_goals: boolean | null
          notification_savings_milestones: boolean | null
          notification_transaction_reminders: boolean | null
          phone_number: string | null
          preferred_currency: string | null
          preferred_language: string | null
          reminder_days_before: number | null
          security_app_lock: boolean | null
          security_hide_balance: boolean | null
          sms_auto_import: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          default_account_id?: string | null
          default_currency?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_bills?: boolean | null
          notification_budget_alerts?: boolean | null
          notification_expenses?: boolean | null
          notification_goals?: boolean | null
          notification_savings_milestones?: boolean | null
          notification_transaction_reminders?: boolean | null
          phone_number?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          reminder_days_before?: number | null
          security_app_lock?: boolean | null
          security_hide_balance?: boolean | null
          sms_auto_import?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          default_account_id?: string | null
          default_currency?: string | null
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          notification_bills?: boolean | null
          notification_budget_alerts?: boolean | null
          notification_expenses?: boolean | null
          notification_goals?: boolean | null
          notification_savings_milestones?: boolean | null
          notification_transaction_reminders?: boolean | null
          phone_number?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          reminder_days_before?: number | null
          security_app_lock?: boolean | null
          security_hide_balance?: boolean | null
          sms_auto_import?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_planned: boolean | null
          is_recurring: boolean | null
          last_processed_date: string | null
          next_occurrence_date: string | null
          recurring_frequency: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_planned?: boolean | null
          is_recurring?: boolean | null
          last_processed_date?: string | null
          next_occurrence_date?: string | null
          recurring_frequency?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_planned?: boolean | null
          is_recurring?: boolean | null
          last_processed_date?: string | null
          next_occurrence_date?: string | null
          recurring_frequency?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          from_id: string
          from_type: string
          id: string
          to_id: string
          to_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          from_id: string
          from_type?: string
          id?: string
          to_id: string
          to_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          from_id?: string
          from_type?: string
          id?: string
          to_id?: string
          to_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
