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
      afazeres: {
        Row: {
          actual_minutes: number | null
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          estimated_minutes: number | null
          id: string
          is_recurrent: boolean
          linked_meta_id: string | null
          recurrent_days: Json | null
          recurrent_end_date: string | null
          start_date: string
          start_time: string | null
          timer_completed_at: string | null
          timer_started_at: string | null
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          actual_minutes?: number | null
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          estimated_minutes?: number | null
          id?: string
          is_recurrent?: boolean
          linked_meta_id?: string | null
          recurrent_days?: Json | null
          recurrent_end_date?: string | null
          start_date: string
          start_time?: string | null
          timer_completed_at?: string | null
          timer_started_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          actual_minutes?: number | null
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          estimated_minutes?: number | null
          id?: string
          is_recurrent?: boolean
          linked_meta_id?: string | null
          recurrent_days?: Json | null
          recurrent_end_date?: string | null
          start_date?: string
          start_time?: string | null
          timer_completed_at?: string | null
          timer_started_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "afazeres_linked_meta_id_fkey"
            columns: ["linked_meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          mission_id: string
          sort_order: number | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          mission_id: string
          sort_order?: number | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          mission_id?: string
          sort_order?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          created_at: string
          daily_goal: number
          date: string
          glasses: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          date?: string
          glasses?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          date?: string
          glasses?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      justificativas: {
        Row: {
          created_at: string
          date: string
          id: string
          mission_id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mission_id: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mission_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goals: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          target_year: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          target_year: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          target_year?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          benefits_1y: string | null
          benefits_30d: string | null
          benefits_6m: string | null
          category: string
          completed: boolean
          created_at: string
          deadline: string
          id: string
          linked_life_goal_id: string | null
          main_action: string
          progress: number
          reward: string | null
          title: string
          total_days: number
          updated_at: string
          user_id: string
          weekly_frequency: number
          xp_earned: number
          xp_total: number
        }
        Insert: {
          benefits_1y?: string | null
          benefits_30d?: string | null
          benefits_6m?: string | null
          category?: string
          completed?: boolean
          created_at?: string
          deadline: string
          id?: string
          linked_life_goal_id?: string | null
          main_action?: string
          progress?: number
          reward?: string | null
          title: string
          total_days?: number
          updated_at?: string
          user_id: string
          weekly_frequency?: number
          xp_earned?: number
          xp_total?: number
        }
        Update: {
          benefits_1y?: string | null
          benefits_30d?: string | null
          benefits_6m?: string | null
          category?: string
          completed?: boolean
          created_at?: string
          deadline?: string
          id?: string
          linked_life_goal_id?: string | null
          main_action?: string
          progress?: number
          reward?: string | null
          title?: string
          total_days?: number
          updated_at?: string
          user_id?: string
          weekly_frequency?: number
          xp_earned?: number
          xp_total?: number
        }
        Relationships: []
      }
      missions: {
        Row: {
          actual_minutes: number | null
          completed_today: boolean
          created_at: string
          daily_target: string | null
          description: string | null
          estimated_minutes: number | null
          frequency: string | null
          id: string
          meta_id: string
          scheduled_day: string | null
          scheduled_time: string | null
          sort_order: number | null
          timer_completed_at: string | null
          timer_started_at: string | null
          title: string
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          actual_minutes?: number | null
          completed_today?: boolean
          created_at?: string
          daily_target?: string | null
          description?: string | null
          estimated_minutes?: number | null
          frequency?: string | null
          id?: string
          meta_id: string
          scheduled_day?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          timer_completed_at?: string | null
          timer_started_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          actual_minutes?: number | null
          completed_today?: boolean
          created_at?: string
          daily_target?: string | null
          description?: string | null
          estimated_minutes?: number | null
          frequency?: string | null
          id?: string
          meta_id?: string
          scheduled_day?: string | null
          scheduled_time?: string | null
          sort_order?: number | null
          timer_completed_at?: string | null
          timer_started_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          alert_tone: string
          badges: Json
          category_streaks: Json
          created_at: string
          days_used: number
          id: string
          last_active_date: string | null
          level: number
          level_name: string
          longest_streak: number
          streak: number
          total_metas_completed: number
          total_missions_completed: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          alert_tone?: string
          badges?: Json
          category_streaks?: Json
          created_at?: string
          days_used?: number
          id?: string
          last_active_date?: string | null
          level?: number
          level_name?: string
          longest_streak?: number
          streak?: number
          total_metas_completed?: number
          total_missions_completed?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          alert_tone?: string
          badges?: Json
          category_streaks?: Json
          created_at?: string
          days_used?: number
          id?: string
          last_active_date?: string | null
          level?: number
          level_name?: string
          longest_streak?: number
          streak?: number
          total_metas_completed?: number
          total_missions_completed?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_missions: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
          week_start: string
          xp_reward: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
          week_start: string
          xp_reward?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
          week_start?: string
          xp_reward?: number
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
