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
      audit_log: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          customer_code: string | null
          email: string | null
          gst_no: string | null
          id: string
          name: string
          phone: string | null
          pincode: string | null
          shirt_size: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_code?: string | null
          email?: string | null
          gst_no?: string | null
          id?: string
          name: string
          phone?: string | null
          pincode?: string | null
          shirt_size?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          customer_code?: string | null
          email?: string | null
          gst_no?: string | null
          id?: string
          name?: string
          phone?: string | null
          pincode?: string | null
          shirt_size?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          article: string
          brand: string
          category: string
          code: string
          composition: string | null
          count_spec: string | null
          created_at: string
          design: string
          finish: string | null
          id: string
          is_active: boolean
          swatch_url: string | null
          updated_at: string
        }
        Insert: {
          article: string
          brand: string
          category?: string
          code: string
          composition?: string | null
          count_spec?: string | null
          created_at?: string
          design: string
          finish?: string | null
          id?: string
          is_active?: boolean
          swatch_url?: string | null
          updated_at?: string
        }
        Update: {
          article?: string
          brand?: string
          category?: string
          code?: string
          composition?: string | null
          count_spec?: string | null
          created_at?: string
          design?: string
          finish?: string | null
          id?: string
          is_active?: boolean
          swatch_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          advance_amount: number | null
          created_at: string
          customer_address: string | null
          customer_city: string | null
          customer_company: string | null
          customer_email: string | null
          customer_gst_no: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_pincode: string | null
          customer_state: string | null
          discount: number | null
          due_date: string | null
          gst_amount: number | null
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes: string | null
          paid_date: string | null
          status: string
          subtotal: number
          tax_mode: string | null
          tax_type: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_gst_no?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          discount?: number | null
          due_date?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date: string
          invoice_number: string
          items?: Json
          notes?: string | null
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_mode?: string | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_gst_no?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          discount?: number | null
          due_date?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_mode?: string | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_form_counters: {
        Row: {
          last_number: number
          order_date: string
        }
        Insert: {
          last_number?: number
          order_date: string
        }
        Update: {
          last_number?: number
          order_date?: string
        }
        Relationships: []
      }
      order_sheet_fabrics: {
        Row: {
          created_at: string
          fabric_id: string
          garment_type: string
          id: string
          order_sheet_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          fabric_id: string
          garment_type: string
          id?: string
          order_sheet_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          fabric_id?: string
          garment_type?: string
          id?: string
          order_sheet_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_sheet_fabrics_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sheet_fabrics_order_sheet_id_fkey"
            columns: ["order_sheet_id"]
            isOneToOne: false
            referencedRelation: "order_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sheets: {
        Row: {
          contact_no: string | null
          created_at: string
          customer_code: string | null
          customer_id: string | null
          customer_name: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_pincode: string | null
          delivery_state: string | null
          id: string
          order_booked_by: string | null
          order_date: string
          order_no: string
          pant_fabric_code: string | null
          pant_fabric_id: string | null
          pant_measurements: Json
          pant_notes: string | null
          pant_standard_size: string | null
          pant_style: Json
          shirt_fabric_code: string | null
          shirt_fabric_id: string | null
          shirt_measurements: Json
          shirt_notes: string | null
          shirt_standard_size: string | null
          shirt_style: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_no?: string | null
          created_at?: string
          customer_code?: string | null
          customer_id?: string | null
          customer_name: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_pincode?: string | null
          delivery_state?: string | null
          id?: string
          order_booked_by?: string | null
          order_date?: string
          order_no: string
          pant_fabric_code?: string | null
          pant_fabric_id?: string | null
          pant_measurements?: Json
          pant_notes?: string | null
          pant_standard_size?: string | null
          pant_style?: Json
          shirt_fabric_code?: string | null
          shirt_fabric_id?: string | null
          shirt_measurements?: Json
          shirt_notes?: string | null
          shirt_standard_size?: string | null
          shirt_style?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_no?: string | null
          created_at?: string
          customer_code?: string | null
          customer_id?: string | null
          customer_name?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_pincode?: string | null
          delivery_state?: string | null
          id?: string
          order_booked_by?: string | null
          order_date?: string
          order_no?: string
          pant_fabric_code?: string | null
          pant_fabric_id?: string | null
          pant_measurements?: Json
          pant_notes?: string | null
          pant_standard_size?: string | null
          pant_style?: Json
          shirt_fabric_code?: string | null
          shirt_fabric_id?: string | null
          shirt_measurements?: Json
          shirt_notes?: string | null
          shirt_standard_size?: string | null
          shirt_style?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_sheets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sheets_pant_fabric_id_fkey"
            columns: ["pant_fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sheets_shirt_fabric_id_fkey"
            columns: ["shirt_fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_city: string | null
          customer_company: string | null
          customer_email: string | null
          customer_gst_no: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          customer_pincode: string | null
          customer_state: string | null
          discount: number | null
          gst_amount: number | null
          id: string
          items: Json
          notes: string | null
          quotation_date: string
          quotation_number: string
          status: string
          subtotal: number
          tax_mode: string | null
          tax_type: string | null
          total_amount: number
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_gst_no?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          discount?: number | null
          gst_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_date: string
          quotation_number: string
          status?: string
          subtotal?: number
          tax_mode?: string | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_gst_no?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          discount?: number | null
          gst_amount?: number | null
          id?: string
          items?: Json
          notes?: string | null
          quotation_date?: string
          quotation_number?: string
          status?: string
          subtotal?: number
          tax_mode?: string | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          setting_data: Json
          setting_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_data?: Json
          setting_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_data?: Json
          setting_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_names: {
        Row: {
          created_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          user_id?: string
          username?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_order_form_id:
        | { Args: never; Returns: string }
        | { Args: { p_order_date: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
