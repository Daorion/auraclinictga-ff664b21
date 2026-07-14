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
      ai_conversations: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string
          id: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          action_key: string
          config: Json
          created_at: string
          id: string
          label: string
          mode: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_key: string
          config?: Json
          created_at?: string
          id?: string
          label: string
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_key?: string
          config?: Json
          created_at?: string
          id?: string
          label?: string
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      appointment_history: {
        Row: {
          appointment_id: string
          changed_at: string
          changed_by: string | null
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          appointment_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          appointment_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          commission_percent: number | null
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          notes: string | null
          price_cents: number
          professional_id: string
          room_id: string | null
          service_id: string | null
          service_name: string
          start_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          notes?: string | null
          price_cents?: number
          professional_id: string
          room_id?: string | null
          service_id?: string | null
          service_name: string
          start_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          commission_percent?: number | null
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          price_cents?: number
          professional_id?: string
          room_id?: string | null
          service_id?: string | null
          service_name?: string
          start_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount_cents: number | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          opening_amount_cents: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount_cents?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount_cents?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount_cents?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          note_type: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_type?: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_type?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_photos: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          photo_url: string
          professional_id: string | null
          storage_path: string | null
          taken_at: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          photo_url: string
          professional_id?: string | null
          storage_path?: string | null
          taken_at?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          photo_url?: string
          professional_id?: string | null
          storage_path?: string | null
          taken_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_photos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          base_amount_cents: number
          created_at: string
          finance_entry_id: string | null
          id: string
          paid_at: string | null
          percent: number
          professional_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          base_amount_cents: number
          created_at?: string
          finance_entry_id?: string | null
          id?: string
          paid_at?: string | null
          percent: number
          professional_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          base_amount_cents?: number
          created_at?: string
          finance_entry_id?: string | null
          id?: string
          paid_at?: string | null
          percent?: number
          professional_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_finance_entry_id_fkey"
            columns: ["finance_entry_id"]
            isOneToOne: false
            referencedRelation: "finance_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string | null
          consent_at: string | null
          consent_marketing: boolean
          created_at: string
          first_seen_at: string
          id: string
          landing_page: string | null
          last_seen_at: string
          metadata: Json
          name: string | null
          origin: string | null
          phone: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          client_id?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          created_at?: string
          first_seen_at?: string
          id?: string
          landing_page?: string | null
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          origin?: string | null
          phone: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          client_id?: string | null
          consent_at?: string | null
          consent_marketing?: boolean
          created_at?: string
          first_seen_at?: string
          id?: string
          landing_page?: string | null
          last_seen_at?: string
          metadata?: Json
          name?: string | null
          origin?: string | null
          phone?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_enabled: boolean
          assigned_to: Database["public"]["Enums"]["conv_assignee"]
          assigned_user_id: string | null
          channel: string
          contact_id: string
          created_at: string
          external_session: string | null
          id: string
          interest: string | null
          internal_notes: string | null
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          stage: Database["public"]["Enums"]["conv_stage"]
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          assigned_to?: Database["public"]["Enums"]["conv_assignee"]
          assigned_user_id?: string | null
          channel?: string
          contact_id: string
          created_at?: string
          external_session?: string | null
          id?: string
          interest?: string | null
          internal_notes?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          stage?: Database["public"]["Enums"]["conv_stage"]
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          assigned_to?: Database["public"]["Enums"]["conv_assignee"]
          assigned_user_id?: string | null
          channel?: string
          contact_id?: string
          created_at?: string
          external_session?: string | null
          id?: string
          interest?: string | null
          internal_notes?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          stage?: Database["public"]["Enums"]["conv_stage"]
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_entries: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          cash_session_id: string | null
          category_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_at: string | null
          id: string
          installment_number: number
          installments: number
          kind: string
          notes: string | null
          paid_at: string | null
          payment_method_id: string | null
          professional_id: string | null
          recurrence: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          appointment_id?: string | null
          cash_session_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_at?: string | null
          id?: string
          installment_number?: number
          installments?: number
          kind: string
          notes?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          professional_id?: string | null
          recurrence?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          cash_session_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_at?: string | null
          id?: string
          installment_number?: number
          installments?: number
          kind?: string
          notes?: string | null
          paid_at?: string | null
          payment_method_id?: string | null
          professional_id?: string | null
          recurrence?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_artworks: {
        Row: {
          ai_prompt: string | null
          background_url: string
          caption: string | null
          created_at: string
          created_by: string | null
          final_url: string | null
          format: string
          hashtags: string | null
          id: string
          overlay_data: Json | null
          service_id: string | null
          service_name: string
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          background_url: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          final_url?: string | null
          format: string
          hashtags?: string | null
          id?: string
          overlay_data?: Json | null
          service_id?: string | null
          service_name: string
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          background_url?: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          final_url?: string | null
          format?: string
          hashtags?: string | null
          id?: string
          overlay_data?: Json | null
          service_id?: string | null
          service_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_artworks_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author: string
          author_user_id: string | null
          body: string | null
          channel: string
          client_id: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          direction: string
          error: string | null
          external_id: string | null
          id: string
          is_draft: boolean
          media_url: string | null
          metadata: Json
          msg_type: string
          sent_at: string
          status: string | null
          updated_at: string
        }
        Insert: {
          author?: string
          author_user_id?: string | null
          body?: string | null
          channel?: string
          client_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          direction: string
          error?: string | null
          external_id?: string | null
          id?: string
          is_draft?: boolean
          media_url?: string | null
          metadata?: Json
          msg_type?: string
          sent_at?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          author?: string
          author_user_id?: string | null
          body?: string | null
          channel?: string
          client_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          direction?: string
          error?: string | null
          external_id?: string | null
          id?: string
          is_draft?: boolean
          media_url?: string | null
          metadata?: Json
          msg_type?: string
          sent_at?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      procedures_pricing: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          notes: string | null
          pricing_json: Json
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          notes?: string | null
          pricing_json?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          notes?: string | null
          pricing_json?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          active: boolean
          commission_percent: number | null
          created_at: string
          duration_minutes: number | null
          id: string
          price_cents: number | null
          professional_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          commission_percent?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          price_cents?: number | null
          professional_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          commission_percent?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          price_cents?: number | null
          professional_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          bio: string | null
          commission_percent: number
          created_at: string
          display_order: number
          email: string | null
          id: string
          name: string
          photo_url: string | null
          slug: string
          title: string | null
          updated_at: string
          user_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          commission_percent?: number
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          name: string
          photo_url?: string | null
          slug: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          commission_percent?: number
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_design_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_favorite: boolean
          kind: string
          name: string
          tokens: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          kind?: string
          name: string
          tokens: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          kind?: string
          name?: string
          tokens?: Json
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          duration: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          name: string
          price_cents: number | null
          professional_name: string | null
          professional_slug: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          name: string
          price_cents?: number | null
          professional_name?: string | null
          professional_slug?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          name?: string
          price_cents?: number | null
          professional_name?: string | null
          professional_slug?: string | null
          updated_at?: string
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
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          last_qr_at: string | null
          last_status_at: string
          metadata: Json
          phone_number: string | null
          session_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_error?: string | null
          last_qr_at?: string | null
          last_status_at?: string
          metadata?: Json
          phone_number?: string | null
          session_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          last_qr_at?: string | null
          last_status_at?: string
          metadata?: Json
          phone_number?: string | null
          session_name?: string
          status?: string
          updated_at?: string
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
      is_own_professional: {
        Args: { _professional_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "profissional"
      conv_assignee: "aurora" | "sirlei"
      conv_stage:
        | "novo_contato"
        | "em_qualificacao"
        | "interessado"
        | "aguardando_resposta"
        | "solicitou_horario"
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "cliente_recorrente"
        | "encerrado"
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
      app_role: ["admin", "editor", "profissional"],
      conv_assignee: ["aurora", "sirlei"],
      conv_stage: [
        "novo_contato",
        "em_qualificacao",
        "interessado",
        "aguardando_resposta",
        "solicitou_horario",
        "agendado",
        "confirmado",
        "em_atendimento",
        "cliente_recorrente",
        "encerrado",
      ],
    },
  },
} as const
