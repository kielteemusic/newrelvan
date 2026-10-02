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
      addresses: {
        Row: {
          address: string
          city: string | null
          country: string | null
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          phone: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          address: string
          city?: string | null
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          phone?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          min_order: number
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          change: number
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          reason: string | null
          resulting_quantity: number
        }
        Insert: {
          change: number
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          reason?: string | null
          resulting_quantity: number
        }
        Update: {
          change?: number
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          reason?: string | null
          resulting_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          delivery_fee: number
          delivery_notes: string | null
          discount_amount: number
          discount_code: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          order_number: string
          payment_status: string
          phone: string | null
          reserved_until: string | null
          state: string | null
          status: string
          subtotal: number
          total: number
          tracking_note: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_notes?: string | null
          discount_amount?: number
          discount_code?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          order_number: string
          payment_status?: string
          phone?: string | null
          reserved_until?: string | null
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_note?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_notes?: string | null
          discount_amount?: number
          discount_code?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          order_number?: string
          payment_status?: string
          phone?: string | null
          reserved_until?: string | null
          state?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_note?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          paid_at: string | null
          provider: string
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          paid_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number | null
          product_id: string
          sku: string | null
          stock_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          benefits: string[]
          best_seller: boolean
          brand: string
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          featured: boolean
          how_to_use: string | null
          id: string
          ingredients: string[]
          name: string
          new_arrival: boolean
          price: number
          short_description: string | null
          size: string | null
          skin_concerns: string[]
          skin_type: string[]
          sku: string | null
          slug: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          best_seller?: boolean
          brand?: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          how_to_use?: string | null
          id?: string
          ingredients?: string[]
          name: string
          new_arrival?: boolean
          price: number
          short_description?: string | null
          size?: string | null
          skin_concerns?: string[]
          skin_type?: string[]
          sku?: string | null
          slug: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefits?: string[]
          best_seller?: boolean
          brand?: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean
          how_to_use?: string | null
          id?: string
          ingredients?: string[]
          name?: string
          new_arrival?: boolean
          price?: number
          short_description?: string | null
          size?: string | null
          skin_concerns?: string[]
          skin_type?: string[]
          sku?: string | null
          slug?: string
          stock_quantity?: number
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
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          created_at: string
          customer_name: string
          id: string
          order_id: string | null
          photo_url: string | null
          product_id: string
          rating: number
          review: string | null
          user_id: string | null
          verified: boolean
        }
        Insert: {
          approved?: boolean
          created_at?: string
          customer_name: string
          id?: string
          order_id?: string | null
          photo_url?: string | null
          product_id: string
          rating: number
          review?: string | null
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          approved?: boolean
          created_at?: string
          customer_name?: string
          id?: string
          order_id?: string | null
          photo_url?: string | null
          product_id?: string
          rating?: number
          review?: string | null
          user_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          about_body: string
          about_eyebrow: string
          about_intro: string
          about_quote: string
          about_title: string
          announcement: string
          business_name: string
          currency: string
          delivery_fee: number
          email: string
          free_delivery_threshold: number
          homepage_eyebrow: string
          homepage_headline: string
          homepage_subcopy: string
          id: boolean
          instagram: string
          low_stock_threshold: number
          routine_eyebrow: string
          routine_intro: string
          routine_steps: Json
          routine_title: string
          updated_at: string
          value_props: Json
          whatsapp: string
        }
        Insert: {
          about_body?: string
          about_eyebrow?: string
          about_intro?: string
          about_quote?: string
          about_title?: string
          announcement?: string
          business_name?: string
          currency?: string
          delivery_fee?: number
          email?: string
          free_delivery_threshold?: number
          homepage_eyebrow?: string
          homepage_headline?: string
          homepage_subcopy?: string
          id?: boolean
          instagram?: string
          low_stock_threshold?: number
          routine_eyebrow?: string
          routine_intro?: string
          routine_steps?: Json
          routine_title?: string
          updated_at?: string
          value_props?: Json
          whatsapp?: string
        }
        Update: {
          about_body?: string
          about_eyebrow?: string
          about_intro?: string
          about_quote?: string
          about_title?: string
          announcement?: string
          business_name?: string
          currency?: string
          delivery_fee?: number
          email?: string
          free_delivery_threshold?: number
          homepage_eyebrow?: string
          homepage_headline?: string
          homepage_subcopy?: string
          id?: boolean
          instagram?: string
          low_stock_threshold?: number
          routine_eyebrow?: string
          routine_intro?: string
          routine_steps?: Json
          routine_title?: string
          updated_at?: string
          value_props?: Json
          whatsapp?: string
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_pending_orders: { Args: never; Returns: number }
      finalize_paid_order: {
        Args: { _amount_kobo: number; _paid_at: string; _reference: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_order_number: { Args: never; Returns: string }
      reserve_order: {
        Args: { _minutes?: number; _order_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
