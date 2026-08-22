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
    PostgrestVersion: "14.4"
  }
  counter: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          store_id: string
        }
        Insert: {
          id?: string
          name: string
          store_id: string
        }
        Update: {
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          customer_id: string
          id: string
          store_id: string
          taken_by: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          customer_id: string
          id?: string
          store_id: string
          taken_by: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          customer_id?: string
          id?: string
          store_id?: string
          taken_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          price_cents: number
          size: string | null
          stock_quantity: number
          store_id: string
          updated_at: string
        }
        Insert: {
          barcode: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          price_cents: number
          size?: string | null
          stock_quantity?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          barcode?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          price_cents?: number
          size?: string | null
          stock_quantity?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          role: Database["counter"]["Enums"]["user_role"]
          store_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          last_name: string
          role?: Database["counter"]["Enums"]["user_role"]
          store_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          role?: Database["counter"]["Enums"]["user_role"]
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          name_snapshot: string
          product_id: string | null
          quantity: number
          sale_id: string
          size_snapshot: string | null
          unit_price_cents: number
        }
        Insert: {
          id?: string
          name_snapshot: string
          product_id?: string | null
          quantity: number
          sale_id: string
          size_snapshot?: string | null
          unit_price_cents: number
        }
        Update: {
          id?: string
          name_snapshot?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          size_snapshot?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string
          created_at: string
          customer_id: string | null
          id: string
          status: Database["counter"]["Enums"]["sale_status"]
          store_id: string
          subtotal_cents: number
        }
        Insert: {
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          status: Database["counter"]["Enums"]["sale_status"]
          store_id: string
          subtotal_cents: number
        }
        Update: {
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: Database["counter"]["Enums"]["sale_status"]
          store_id?: string
          subtotal_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          billing_note: string | null
          country: string | null
          created_at: string
          currency: string
          id: string
          is_paused: boolean
          low_stock_threshold: number
          name: string
          paid_until: string | null
          phone: string | null
          plan: Database["counter"]["Enums"]["store_plan"]
        }
        Insert: {
          address?: string | null
          billing_note?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_paused?: boolean
          low_stock_threshold?: number
          name: string
          paid_until?: string | null
          phone?: string | null
          plan?: Database["counter"]["Enums"]["store_plan"]
        }
        Update: {
          address?: string | null
          billing_note?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_paused?: boolean
          low_stock_threshold?: number
          name?: string
          paid_until?: string | null
          phone?: string | null
          plan?: Database["counter"]["Enums"]["store_plan"]
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_balances: {
        Row: {
          balance_cents: number | null
          id: string | null
          name: string | null
          oldest_unpaid: string | null
          phone: string | null
          store_id: string | null
          unpaid_sales: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_is_admin: { Args: never; Returns: boolean }
      auth_is_super_admin: { Args: never; Returns: boolean }
      auth_store_id: { Args: never; Returns: string }
      create_sale: {
        Args: {
          items: Json
          p_customer_id?: string
          p_status?: Database["counter"]["Enums"]["sale_status"]
        }
        Returns: {
          sale_id: string
          subtotal_cents: number
        }[]
      }
      create_store_and_profile: {
        Args: {
          first: string
          last: string
          p_country?: string | null
          p_currency?: string
          store_name: string
        }
        Returns: string
      }
      record_payment: {
        Args: { p_amount_cents: number; p_customer_id: string }
        Returns: {
          payment_id: string
          balance_cents: number
          settled_count: number
        }[]
      }
      super_admin_extend_store: {
        Args: {
          p_extend_interval: string
          p_note?: string | null
          p_store_id: string
        }
        Returns: string
      }
      super_admin_list_stores: {
        Args: never
        Returns: {
          billing_note: string
          country: string
          created_at: string
          currency: string
          is_paused: boolean
          owner_email: string
          owner_first_name: string
          owner_last_name: string
          paid_until: string
          plan: Database["counter"]["Enums"]["store_plan"]
          store_id: string
          store_name: string
        }[]
      }
      super_admin_set_store_billing: {
        Args: {
          p_note?: string | null
          p_paid_until: string | null
          p_plan: Database["counter"]["Enums"]["store_plan"]
          p_store_id: string
        }
        Returns: undefined
      }
      super_admin_set_store_paused: {
        Args: { p_paused: boolean; p_store_id: string }
        Returns: undefined
      }
    }
    Enums: {
      sale_status: "PAID" | "UNPAID" | "SETTLED"
      store_plan: "TRIAL" | "PAID"
      user_role: "OWNER" | "ADMIN" | "CASHIER"
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
  counter: {
    Enums: {
      sale_status: ["PAID", "UNPAID", "SETTLED"],
      store_plan: ["TRIAL", "PAID"],
      user_role: ["OWNER", "ADMIN", "CASHIER"],
    },
  },
} as const
