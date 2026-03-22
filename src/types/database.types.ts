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
  public: {
    Tables: {
      anonymous_message_counts: {
        Row: {
          message_count: number
          reset_date: string
          user_id: string
        }
        Insert: {
          message_count?: number
          reset_date?: string
          user_id: string
        }
        Update: {
          message_count?: number
          reset_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_message_counts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_counts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["admin_action"]
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["audit_target_type"]
        }
        Insert: {
          action: Database["public"]["Enums"]["admin_action"]
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["audit_target_type"]
        }
        Update: {
          action?: Database["public"]["Enums"]["admin_action"]
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["audit_target_type"]
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_hidden: boolean
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_emoji: string
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          member_count: number
          name: string
          slug: string
          tag: string
        }
        Insert: {
          avatar_emoji?: string
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
          slug: string
          tag: string
        }
        Update: {
          avatar_emoji?: string
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
          slug?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          dm_status: Database["public"]["Enums"]["dm_request_status"] | null
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          role: Database["public"]["Enums"]["conversation_role"]
          user_id: string
        }
        Insert: {
          conversation_id: string
          dm_status?: Database["public"]["Enums"]["dm_request_status"] | null
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["conversation_role"]
          user_id: string
        }
        Update: {
          conversation_id?: string
          dm_status?: Database["public"]["Enums"]["dm_request_status"] | null
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["conversation_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          community_id: string | null
          created_at: string
          id: string
          name: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number
          capacity: number | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          community_id: string | null
          cover_url: string | null
          created_at: string
          description: string
          emoji: string | null
          end_time: string | null
          event_date: string
          event_time: string
          host_id: string
          id: string
          is_private: boolean
          is_recurring: boolean
          recurrence_rule: string | null
          title: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          attendee_count?: number
          capacity?: number | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description: string
          emoji?: string | null
          end_time?: string | null
          event_date: string
          event_time: string
          host_id: string
          id?: string
          is_private?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          title: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          attendee_count?: number
          capacity?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          city?: string
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          emoji?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string
          host_id?: string
          id?: string
          is_private?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          title?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_saves: {
        Row: {
          job_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          job_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          job_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_saves_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          apply_email: string | null
          apply_url: string | null
          city: string
          company: string
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_remote: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          posted_by: string
          salary_range: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          apply_email?: string | null
          apply_url?: string | null
          city: string
          company: string
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          posted_by: string
          salary_range?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          apply_email?: string | null
          apply_url?: string | null
          city?: string
          company?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          posted_by?: string
          salary_range?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          is_system: boolean
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_system?: boolean
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_system?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          post_id: string
          reaction_type: number
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction_type: number
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction_type?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number
          community_id: string | null
          content: string
          created_at: string
          id: string
          image_urls: string[] | null
          is_anonymous: boolean
          is_flagged: boolean
          is_hidden: boolean
          reaction_count: number
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_count?: number
          community_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          is_anonymous?: boolean
          is_flagged?: boolean
          is_hidden?: boolean
          reaction_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_count?: number
          community_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          is_anonymous?: boolean
          is_flagged?: boolean
          is_hidden?: boolean
          reaction_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anon_suspended: boolean
          anon_unlocked: boolean
          anonymous_alias: string | null
          avatar_emoji: string
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          city: Database["public"]["Enums"]["city_enum"]
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_anonymous: boolean
          is_available: boolean
          is_banned: boolean
          is_verified: boolean
          profession: Database["public"]["Enums"]["profession_enum"]
          pronouns: string | null
          real_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          search_vector: unknown
          show_photo: boolean
          show_real_name: boolean
          skills: string[] | null
          theme_pref: Database["public"]["Enums"]["theme_preference"]
          trust_score: number
          updated_at: string
          username: string
        }
        Insert: {
          anon_suspended?: boolean
          anon_unlocked?: boolean
          anonymous_alias?: string | null
          avatar_emoji?: string
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          city?: Database["public"]["Enums"]["city_enum"]
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_anonymous?: boolean
          is_available?: boolean
          is_banned?: boolean
          is_verified?: boolean
          profession?: Database["public"]["Enums"]["profession_enum"]
          pronouns?: string | null
          real_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          search_vector?: unknown
          show_photo?: boolean
          show_real_name?: boolean
          skills?: string[] | null
          theme_pref?: Database["public"]["Enums"]["theme_preference"]
          trust_score?: number
          updated_at?: string
          username: string
        }
        Update: {
          anon_suspended?: boolean
          anon_unlocked?: boolean
          anonymous_alias?: string | null
          avatar_emoji?: string
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          city?: Database["public"]["Enums"]["city_enum"]
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_anonymous?: boolean
          is_available?: boolean
          is_banned?: boolean
          is_verified?: boolean
          profession?: Database["public"]["Enums"]["profession_enum"]
          pronouns?: string | null
          real_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          search_vector?: unknown
          show_photo?: boolean
          show_real_name?: boolean
          skills?: string[] | null
          theme_pref?: Database["public"]["Enums"]["theme_preference"]
          trust_score?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_content_id: string | null
          reported_content_type:
            | Database["public"]["Enums"]["reportable_content_type"]
            | null
          reported_user_id: string | null
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_content_id?: string | null
          reported_content_type?:
            | Database["public"]["Enums"]["reportable_content_type"]
            | null
          reported_user_id?: string | null
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_content_id?: string | null
          reported_content_type?:
            | Database["public"]["Enums"]["reportable_content_type"]
            | null
          reported_user_id?: string | null
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_emoji: string | null
          bio: string | null
          created_at: string | null
          display_avatar: string | null
          display_city: Database["public"]["Enums"]["city_enum"] | null
          display_name: string | null
          display_real_name: string | null
          id: string | null
          is_available: boolean | null
          is_verified: boolean | null
          profession: Database["public"]["Enums"]["profession_enum"] | null
          pronouns: string | null
          skills: string[] | null
        }
        Insert: {
          avatar_emoji?: string | null
          bio?: string | null
          created_at?: string | null
          display_avatar?: never
          display_city?: never
          display_name?: never
          display_real_name?: never
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          profession?: Database["public"]["Enums"]["profession_enum"] | null
          pronouns?: string | null
          skills?: string[] | null
        }
        Update: {
          avatar_emoji?: string | null
          bio?: string | null
          created_at?: string | null
          display_avatar?: never
          display_city?: never
          display_name?: never
          display_real_name?: never
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          profession?: Database["public"]["Enums"]["profession_enum"] | null
          pronouns?: string | null
          skills?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_anonymous_eligibility: {
        Args: { p_user_id: string }
        Returns: {
          eligible: boolean
          reason: string
        }[]
      }
      check_anonymous_message_limit: {
        Args: { p_user_id: string }
        Returns: number
      }
      daily_trust_score_increment: { Args: never; Returns: number }
      expire_old_jobs: { Args: never; Returns: undefined }
      generate_anonymous_alias: { Args: never; Returns: string }
      get_my_profile_field: { Args: { field_name: string }; Returns: string }
      get_or_create_dm: {
        Args: { p_user1: string; p_user2: string }
        Returns: string
      }
      increment_anonymous_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id?: string }; Returns: boolean }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_community_accessible: {
        Args: { community_uuid: string }
        Returns: boolean
      }
      is_community_admin: { Args: { community_uuid: string }; Returns: boolean }
      is_community_member: {
        Args: { community_uuid: string }
        Returns: boolean
      }
      is_conversation_admin: {
        Args: { conversation_uuid: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { conversation_uuid: string }
        Returns: boolean
      }
      is_super_admin: { Args: { p_user_id?: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: Database["public"]["Enums"]["admin_action"]
          p_actor_id: string
          p_details?: Json
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["audit_target_type"]
        }
        Returns: string
      }
      process_anonymous_report: {
        Args: { p_reported_user_id: string }
        Returns: {
          action_taken: string
          strike_count: number
        }[]
      }
      promote_to_admin: {
        Args: { p_email: string; p_role?: string }
        Returns: {
          message: string
          success: boolean
          user_id: string
        }[]
      }
    }
    Enums: {
      admin_action:
        | "ban_user"
        | "unban_user"
        | "verify_user"
        | "unverify_user"
        | "resolve_report"
        | "dismiss_report"
        | "delete_content"
        | "restore_content"
        | "feature_event"
        | "unfeature_event"
        | "suspend_anonymous"
        | "restore_anonymous"
        | "delete_community"
        | "warn_user"
      audit_target_type:
        | "user"
        | "post"
        | "comment"
        | "event"
        | "community"
        | "report"
        | "message"
        | "job"
      city_enum:
        | "Mumbai"
        | "Delhi"
        | "Bangalore"
        | "Hyderabad"
        | "Chennai"
        | "Kolkata"
        | "Pune"
        | "Ahmedabad"
        | "Jaipur"
        | "Lucknow"
        | "Chandigarh"
        | "Kochi"
        | "Goa"
        | "Indore"
        | "Coimbatore"
        | "Nagpur"
        | "Vadodara"
        | "Surat"
        | "Thiruvananthapuram"
        | "Bhopal"
        | "Visakhapatnam"
        | "Mysore"
        | "Other"
      conversation_role: "member" | "admin"
      conversation_type: "dm" | "group"
      dm_request_status: "pending" | "accepted" | "declined"
      event_category:
        | "art"
        | "music"
        | "tech"
        | "wellness"
        | "dance"
        | "books"
        | "fitness"
        | "social"
        | "support"
        | "workshop"
      job_type:
        | "full_time"
        | "part_time"
        | "freelance"
        | "internship"
        | "contract"
      profession_enum:
        | "Software Engineer"
        | "Designer"
        | "Product Manager"
        | "Data Scientist"
        | "Doctor"
        | "Lawyer"
        | "Therapist"
        | "Counselor"
        | "Teacher"
        | "Professor"
        | "Writer"
        | "Artist"
        | "Musician"
        | "Photographer"
        | "Filmmaker"
        | "Marketing"
        | "Finance"
        | "HR"
        | "Entrepreneur"
        | "Consultant"
        | "Social Worker"
        | "NGO Worker"
        | "Activist"
        | "Healthcare Worker"
        | "Student"
        | "Researcher"
        | "Journalist"
        | "Content Creator"
        | "Other"
      report_reason:
        | "harassment"
        | "spam"
        | "inappropriate"
        | "doxxing"
        | "hate_speech"
        | "other"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      reportable_content_type:
        | "post"
        | "comment"
        | "message"
        | "profile"
        | "event"
      rsvp_status: "going" | "maybe" | "waitlisted"
      theme_preference: "light" | "dark" | "system"
      user_role:
        | "member"
        | "city_mod"
        | "community_mod"
        | "admin"
        | "super_admin"
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
      admin_action: [
        "ban_user",
        "unban_user",
        "verify_user",
        "unverify_user",
        "resolve_report",
        "dismiss_report",
        "delete_content",
        "restore_content",
        "feature_event",
        "unfeature_event",
        "suspend_anonymous",
        "restore_anonymous",
        "delete_community",
        "warn_user",
      ],
      audit_target_type: [
        "user",
        "post",
        "comment",
        "event",
        "community",
        "report",
        "message",
        "job",
      ],
      city_enum: [
        "Mumbai",
        "Delhi",
        "Bangalore",
        "Hyderabad",
        "Chennai",
        "Kolkata",
        "Pune",
        "Ahmedabad",
        "Jaipur",
        "Lucknow",
        "Chandigarh",
        "Kochi",
        "Goa",
        "Indore",
        "Coimbatore",
        "Nagpur",
        "Vadodara",
        "Surat",
        "Thiruvananthapuram",
        "Bhopal",
        "Visakhapatnam",
        "Mysore",
        "Other",
      ],
      conversation_role: ["member", "admin"],
      conversation_type: ["dm", "group"],
      dm_request_status: ["pending", "accepted", "declined"],
      event_category: [
        "art",
        "music",
        "tech",
        "wellness",
        "dance",
        "books",
        "fitness",
        "social",
        "support",
        "workshop",
      ],
      job_type: [
        "full_time",
        "part_time",
        "freelance",
        "internship",
        "contract",
      ],
      profession_enum: [
        "Software Engineer",
        "Designer",
        "Product Manager",
        "Data Scientist",
        "Doctor",
        "Lawyer",
        "Therapist",
        "Counselor",
        "Teacher",
        "Professor",
        "Writer",
        "Artist",
        "Musician",
        "Photographer",
        "Filmmaker",
        "Marketing",
        "Finance",
        "HR",
        "Entrepreneur",
        "Consultant",
        "Social Worker",
        "NGO Worker",
        "Activist",
        "Healthcare Worker",
        "Student",
        "Researcher",
        "Journalist",
        "Content Creator",
        "Other",
      ],
      report_reason: [
        "harassment",
        "spam",
        "inappropriate",
        "doxxing",
        "hate_speech",
        "other",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      reportable_content_type: [
        "post",
        "comment",
        "message",
        "profile",
        "event",
      ],
      rsvp_status: ["going", "maybe", "waitlisted"],
      theme_preference: ["light", "dark", "system"],
      user_role: [
        "member",
        "city_mod",
        "community_mod",
        "admin",
        "super_admin",
      ],
    },
  },
} as const
