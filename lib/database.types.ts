export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)'
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_policy_agreed: boolean | null
          collection_date: string
          collection_time_slot: string
          created_at: string
          id: number
          services_config: Json
          special_instructions: string | null
          stain_images: string[] | null
          status: string
          terms_agreed: boolean | null
          total_price: number
          user_id: string
          washer_id: string | null
        }
        Insert: {
          cancellation_policy_agreed?: boolean | null
          collection_date: string
          collection_time_slot: string
          created_at?: string
          id?: number
          services_config: Json
          special_instructions?: string | null
          stain_images?: string[] | null
          status?: string
          terms_agreed?: boolean | null
          total_price: number
          user_id: string
          washer_id?: string | null
        }
        Update: {
          cancellation_policy_agreed?: boolean | null
          collection_date?: string
          collection_time_slot?: string
          created_at?: string
          id?: number
          services_config?: Json
          special_instructions?: string | null
          stain_images?: string[] | null
          status?: string
          terms_agreed?: boolean | null
          total_price?: number
          user_id?: string
          washer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_fee_paid: boolean | null
          phone_number: string | null
          role: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          updated_at: string
          washer_status: string | null
          service_offerings: string[] | null
          availability_schedule: Json | null
          service_area_radius: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_fee_paid?: boolean | null
          phone_number?: string | null
          role?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          updated_at?: string
          washer_status?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_fee_paid?: boolean | null
          phone_number?: string | null
          role?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          updated_at?: string
          washer_status?: string | null
        }
        Relationships: []
      }
      washer_applications: {
        Row: {
          collection_fee: number | null
          collection_radius: number | null
          created_at: string
          equipment_details: string
          id: string
          offers_collection: boolean | null
          phone_number: string
          profile_id: string
          service_address: string
          service_offerings: string[]
          status: string
          updated_at: string
          user_id: string
          washer_bio: string
        }
        Insert: {
          collection_fee?: number | null
          collection_radius?: number | null
          created_at?: string
          equipment_details: string
          id?: string
          offers_collection?: boolean | null
          phone_number: string
          profile_id: string
          service_address: string
          service_offerings: string[]
          status?: string
          updated_at?: string
          user_id: string
          washer_bio: string
        }
        Update: {
          collection_fee?: number | null
          collection_radius?: number | null
          created_at?: string
          equipment_details?: string
          id?: string
          offers_collection?: boolean | null
          phone_number?: string
          profile_id?: string
          service_address?: string
          service_offerings?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          washer_bio?: string
        }
        Relationships: [
          {
            foreignKeyName: 'washer_applications_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
