export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      states: {
        Row: {
          id: string
          state_code: string | null
          state_name: string | null
        }
        Insert: {
          id?: string
          state_code?: string | null
          state_name?: string | null
        }
        Update: {
          id?: string
          state_code?: string | null
          state_name?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          id: string
          state_id: string | null
          district_name: string | null
        }
        Insert: {
          id?: string
          state_id?: string | null
          district_name?: string | null
        }
        Update: {
          id?: string
          state_id?: string | null
          district_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_state_id_fkey"
            columns: ["state_id"]
            referencedRelation: "states"
            referencedColumns: ["id"]
          }
        ]
      }
      cities: {
        Row: {
          id: string
          district_id: string | null
          city_name: string | null
        }
        Insert: {
          id?: string
          district_id?: string | null
          city_name?: string | null
        }
        Update: {
          id?: string
          district_id?: string | null
          city_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_district_id_fkey"
            columns: ["district_id"]
            referencedRelation: "districts"
            referencedColumns: ["id"]
          }
        ]
      }
      offices: {
        Row: {
          id: string
          state_id: string | null
          district_id: string | null
          city_id: string | null
          department: string | null
          department_id: string | null
          office_name: string | null
          address: string | null
          pincode: string | null
          phone: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          working_hours: string | null
          is_active: boolean | null
          created_at: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          state_id?: string | null
          district_id?: string | null
          city_id?: string | null
          department?: string | null
          department_id?: string | null
          office_name?: string | null
          address?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          working_hours?: string | null
          is_active?: boolean | null
          created_at?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          state_id?: string | null
          district_id?: string | null
          city_id?: string | null
          department?: string | null
          department_id?: string | null
          office_name?: string | null
          address?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          working_hours?: string | null
          is_active?: boolean | null
          created_at?: string | null
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_state_id_fkey"
            columns: ["state_id"]
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_district_id_fkey"
            columns: ["district_id"]
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_city_id_fkey"
            columns: ["city_id"]
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          department: string | null
          department_id: string | null
          service_name: string | null
          avg_duration_minutes: number | null
          required_documents: Json | null
          slot_capacity: number | null
          priority_allowed: boolean | null
          description: string | null
          office_id: string | null
        }
        Insert: {
          id?: string
          department?: string | null
          department_id?: string | null
          service_name?: string | null
          avg_duration_minutes?: number | null
          required_documents?: Json | null
          slot_capacity?: number | null
          priority_allowed?: boolean | null
          description?: string | null
          office_id?: string | null
        }
        Update: {
          id?: string
          department?: string | null
          department_id?: string | null
          service_name?: string | null
          avg_duration_minutes?: number | null
          required_documents?: Json | null
          slot_capacity?: number | null
          priority_allowed?: boolean | null
          description?: string | null
          office_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_office_id_fkey"
            columns: ["office_id"]
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          code: string | null
          name: string | null
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code?: string | null
          name?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string | null
          name?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      counters: {
        Row: {
          id: string
          office_id: string
          department_id: string | null
          code: string
          name: string | null
          is_active: boolean | null
          current_token_id: string | null
          served_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          office_id: string
          department_id?: string | null
          code: string
          name?: string | null
          is_active?: boolean | null
          current_token_id?: string | null
          served_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          office_id?: string
          department_id?: string | null
          code?: string
          name?: string | null
          is_active?: boolean | null
          current_token_id?: string | null
          served_count?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counters_office_id_fkey"
            columns: ["office_id"]
            referencedRelation: "offices"
            referencedColumns: ["id"]
          }
        ]
      }
      tokens: {
        Row: {
          id: string
          token_number: string
          user_id: string
          office_id: string
          office_name: string
          service_name: string
          department: string | null
          department_id?: string | null // Added manually
          appointment_date: string
          appointment_time: string
          status: string
          position_in_queue: number | null
          estimated_wait_minutes: number | null
          created_at: string | null
          updated_at: string | null
          served_at: string | null
          served_by: string | null
        }
        Insert: {
          id?: string
          token_number: string
          user_id: string
          office_id: string
          office_name: string
          service_name: string
          department?: string | null
          department_id?: string | null // Added manually
          appointment_date: string
          appointment_time: string
          status?: string
          position_in_queue?: number | null
          estimated_wait_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
          served_at?: string | null
          served_by?: string | null
        }
        Update: {
          id?: string
          token_number?: string
          user_id?: string
          office_id?: string
          office_name?: string
          service_name?: string
          department?: string | null
          department_id?: string | null // Added manually
          appointment_date?: string
          appointment_time?: string
          status?: string
          position_in_queue?: number | null
          estimated_wait_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
          served_at?: string | null
          served_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_office_id_fkey"
            columns: ["office_id"]
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tokens_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      service_logs: {
        Row: {
          id: string
          office_id: string | null
          service_name: string | null
          duration_minutes: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          office_id?: string | null
          service_name?: string | null
          duration_minutes?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          office_id?: string | null
          service_name?: string | null
          duration_minutes?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_logs_office_id_fkey"
            columns: ["office_id"]
            referencedRelation: "offices"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          is_active_counter: boolean | null
          current_counter_number: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          is_active_counter?: boolean | null
          current_counter_number?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          is_active_counter?: boolean | null
          current_counter_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "citizen" | "official"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "public"> & { public: Database["public"] }

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
