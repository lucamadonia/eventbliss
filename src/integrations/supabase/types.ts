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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_comments: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          participant_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          participant_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "schedule_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_comments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string
          currency: string | null
          customer_email: string | null
          id: string
          notes: string | null
          order_amount: number
          payout_id: string | null
          redemption_id: string | null
          status: Database["public"]["Enums"]["commission_status"] | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subscription_id: string | null
          updated_at: string
          voucher_id: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_rate: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          id?: string
          notes?: string | null
          order_amount: number
          payout_id?: string | null
          redemption_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          voucher_id?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_rate?: number
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          id?: string
          notes?: string | null
          order_amount?: number
          payout_id?: string | null
          redemption_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "voucher_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          commission_count: number | null
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          payout_method: Database["public"]["Enums"]["payout_method"]
          payout_reference: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payout_method: Database["public"]["Enums"]["payout_method"]
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_count?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payout_method?: Database["public"]["Enums"]["payout_method"]
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_vouchers: {
        Row: {
          affiliate_id: string
          created_at: string
          custom_commission_rate: number | null
          custom_commission_type:
            | Database["public"]["Enums"]["commission_type"]
            | null
          id: string
          voucher_id: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          custom_commission_rate?: number | null
          custom_commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          id?: string
          voucher_id: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          custom_commission_rate?: number | null
          custom_commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_vouchers_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_vouchers_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_rate: number | null
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          company_name: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          payout_details: Json | null
          payout_method: Database["public"]["Enums"]["payout_method"] | null
          pending_balance: number | null
          phone: string | null
          status: Database["public"]["Enums"]["affiliate_status"] | null
          tax_id: string | null
          tier: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings: number | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          commission_rate?: number | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          pending_balance?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"] | null
          tax_id?: string | null
          tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          commission_rate?: number | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          pending_balance?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"] | null
          tax_id?: string | null
          tier?: Database["public"]["Enums"]["affiliate_tier"] | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          access_code: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          event_date: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          honoree_name: string
          id: string
          is_public: boolean | null
          locale: string | null
          name: string
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          survey_deadline: string | null
          theme: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          access_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          honoree_name: string
          id?: string
          is_public?: boolean | null
          locale?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          survey_deadline?: string | null
          theme?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          access_code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          honoree_name?: string
          id?: string
          is_public?: boolean | null
          locale?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          survey_deadline?: string | null
          theme?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_shares: {
        Row: {
          amount: number
          created_at: string
          expense_id: string
          id: string
          is_paid: boolean | null
          paid_at: string | null
          participant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expense_id: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          participant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_shares_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string
          event_id: string
          expense_date: string | null
          id: string
          paid_by_participant_id: string | null
          receipt_url: string | null
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description: string
          event_id: string
          expense_date?: string | null
          id?: string
          paid_by_participant_id?: string | null
          receipt_url?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string
          event_id?: string
          expense_date?: string | null
          id?: string
          paid_by_participant_id?: string | null
          receipt_url?: string | null
          split_type?: Database["public"]["Enums"]["split_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_participant_id_fkey"
            columns: ["paid_by_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          channels: string[] | null
          content_template: string
          created_at: string
          emoji_prefix: string | null
          event_id: string
          id: string
          locale: string | null
          sort_order: number | null
          template_key: string
          title: string
          updated_at: string
        }
        Insert: {
          channels?: string[] | null
          content_template: string
          created_at?: string
          emoji_prefix?: string | null
          event_id: string
          id?: string
          locale?: string | null
          sort_order?: number | null
          template_key: string
          title: string
          updated_at?: string
        }
        Update: {
          channels?: string[] | null
          content_template?: string
          created_at?: string
          emoji_prefix?: string | null
          event_id?: string
          id?: string
          locale?: string | null
          sort_order?: number | null
          template_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          gdpr_consent: boolean
          id: string
          ip_address: string | null
          locale: string | null
          marketing_consent: boolean
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          gdpr_consent?: boolean
          id?: string
          ip_address?: string | null
          locale?: string | null
          marketing_consent?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          gdpr_consent?: boolean
          id?: string
          ip_address?: string | null
          locale?: string | null
          marketing_consent?: boolean
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          avatar_url: string | null
          can_access_dashboard: boolean | null
          created_at: string
          dashboard_permissions: Json | null
          email: string | null
          event_id: string
          id: string
          invite_claimed_at: string | null
          invite_sent_at: string | null
          invite_token: string | null
          joined_at: string | null
          name: string
          phone: string | null
          response_id: string | null
          role: Database["public"]["Enums"]["participant_role"]
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_access_dashboard?: boolean | null
          created_at?: string
          dashboard_permissions?: Json | null
          email?: string | null
          event_id: string
          id?: string
          invite_claimed_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          joined_at?: string | null
          name: string
          phone?: string | null
          response_id?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_access_dashboard?: boolean | null
          created_at?: string
          dashboard_permissions?: Json | null
          email?: string | null
          event_id?: string
          id?: string
          invite_claimed_at?: string | null
          invite_sent_at?: string | null
          invite_token?: string | null
          joined_at?: string | null
          name?: string
          phone?: string | null
          response_id?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          must_change_password: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          must_change_password?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          must_change_password?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      responses: {
        Row: {
          alcohol: string | null
          attendance: string
          budget: string
          created_at: string
          date_blocks: string[]
          de_city: string | null
          destination: string
          duration_pref: string
          event_id: string | null
          fitness_level: string
          id: string
          meta: Json | null
          partial_days: string | null
          participant: string
          preferences: string[]
          restrictions: string | null
          suggestions: string | null
          travel_pref: string
          updated_at: string
        }
        Insert: {
          alcohol?: string | null
          attendance: string
          budget: string
          created_at?: string
          date_blocks: string[]
          de_city?: string | null
          destination: string
          duration_pref: string
          event_id?: string | null
          fitness_level: string
          id?: string
          meta?: Json | null
          partial_days?: string | null
          participant: string
          preferences: string[]
          restrictions?: string | null
          suggestions?: string | null
          travel_pref: string
          updated_at?: string
        }
        Update: {
          alcohol?: string | null
          attendance?: string
          budget?: string
          created_at?: string
          date_blocks?: string[]
          de_city?: string | null
          destination?: string
          duration_pref?: string
          event_id?: string | null
          fitness_level?: string
          id?: string
          meta?: Json | null
          partial_days?: string | null
          participant?: string
          preferences?: string[]
          restrictions?: string | null
          suggestions?: string | null
          travel_pref?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_activities: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cost_per_person: boolean | null
          created_at: string
          currency: string | null
          day_date: string
          description: string | null
          end_time: string | null
          estimated_cost: number | null
          event_id: string
          id: string
          location: string | null
          location_url: string | null
          notes: string | null
          requirements: string[] | null
          responsible_participant_id: string | null
          sort_order: number | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_per_person?: boolean | null
          created_at?: string
          currency?: string | null
          day_date: string
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          event_id: string
          id?: string
          location?: string | null
          location_url?: string | null
          notes?: string | null
          requirements?: string[] | null
          responsible_participant_id?: string | null
          sort_order?: number | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_per_person?: boolean | null
          created_at?: string
          currency?: string | null
          day_date?: string
          description?: string | null
          end_time?: string | null
          estimated_cost?: number | null
          event_id?: string
          id?: string
          location?: string | null
          location_url?: string | null
          notes?: string | null
          requirements?: string[] | null
          responsible_participant_id?: string | null
          sort_order?: number | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_activities_responsible_participant_id_fkey"
            columns: ["responsible_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
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
      voucher_redemptions: {
        Row: {
          id: string
          redeemed_at: string | null
          subscription_id: string | null
          user_id: string
          voucher_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          subscription_id?: string | null
          user_id: string
          voucher_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          subscription_id?: string | null
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          discount_type: string
          discount_value: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          stripe_coupon_id: string | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          discount_type: string
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          stripe_coupon_id?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          discount_type?: string
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          stripe_coupon_id?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_affiliate_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_event_organizer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_participant: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_premium: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "suspended" | "terminated"
      affiliate_tier: "bronze" | "silver" | "gold" | "platinum"
      app_role: "admin" | "organizer" | "member"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      commission_type: "percentage" | "fixed"
      event_status: "draft" | "planning" | "active" | "completed" | "cancelled"
      event_type: "bachelor" | "bachelorette" | "birthday" | "trip" | "other"
      expense_category:
        | "transport"
        | "accommodation"
        | "activities"
        | "food"
        | "drinks"
        | "gifts"
        | "other"
      participant_role: "organizer" | "guest"
      participant_status: "invited" | "confirmed" | "declined" | "maybe"
      payout_method: "bank_transfer" | "paypal" | "stripe"
      payout_status: "pending" | "processing" | "completed" | "failed"
      split_type: "equal" | "custom" | "percentage"
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
    Enums: {
      affiliate_status: ["pending", "active", "suspended", "terminated"],
      affiliate_tier: ["bronze", "silver", "gold", "platinum"],
      app_role: ["admin", "organizer", "member"],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      commission_type: ["percentage", "fixed"],
      event_status: ["draft", "planning", "active", "completed", "cancelled"],
      event_type: ["bachelor", "bachelorette", "birthday", "trip", "other"],
      expense_category: [
        "transport",
        "accommodation",
        "activities",
        "food",
        "drinks",
        "gifts",
        "other",
      ],
      participant_role: ["organizer", "guest"],
      participant_status: ["invited", "confirmed", "declined", "maybe"],
      payout_method: ["bank_transfer", "paypal", "stripe"],
      payout_status: ["pending", "processing", "completed", "failed"],
      split_type: ["equal", "custom", "percentage"],
    },
  },
} as const
