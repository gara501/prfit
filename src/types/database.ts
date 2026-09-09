export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      body_compositions: {
        Row: {
          chest: number | null;
          client_id: string;
          date: string;
          fat_percentage: number | null;
          height: number | null;
          hips: number | null;
          id: string;
          left_arm: number | null;
          left_leg: number | null;
          neck: number | null;
          notes: string | null;
          right_arm: number | null;
          right_leg: number | null;
          shoulders: number | null;
          trainer_id: string;
          waist: number | null;
          weight: number | null;
        };
        Insert: {
          chest?: number | null;
          client_id: string;
          date?: string;
          fat_percentage?: number | null;
          height?: number | null;
          hips?: number | null;
          id?: string;
          left_arm?: number | null;
          left_leg?: number | null;
          neck?: number | null;
          notes?: string | null;
          right_arm?: number | null;
          right_leg?: number | null;
          shoulders?: number | null;
          trainer_id: string;
          waist?: number | null;
          weight?: number | null;
        };
        Update: {
          chest?: number | null;
          client_id?: string;
          date?: string;
          fat_percentage?: number | null;
          height?: number | null;
          hips?: number | null;
          id?: string;
          left_arm?: number | null;
          left_leg?: number | null;
          neck?: number | null;
          notes?: string | null;
          right_arm?: number | null;
          right_leg?: number | null;
          shoulders?: number | null;
          trainer_id?: string;
          waist?: number | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_compositions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "body_compositions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      body_zones: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      health_audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          client_id: string;
          created_at: string;
          id: number;
          screening_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          client_id: string;
          created_at?: string;
          id?: never;
          screening_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          client_id?: string;
          created_at?: string;
          id?: never;
          screening_id?: string | null;
        };
        Relationships: [];
      };
      health_documents: {
        Row: {
          client_id: string;
          created_at: string;
          id: string;
          mime_type: string;
          original_name: string;
          purpose: string;
          screening_id: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id?: string;
          mime_type: string;
          original_name: string;
          purpose: string;
          screening_id: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          mime_type?: string;
          original_name?: string;
          purpose?: string;
          screening_id?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by?: string;
        };
        Relationships: [];
      };
      health_screening_reviews: {
        Row: {
          decision: string;
          encryption_iv: string | null;
          encryption_key_version: number | null;
          encryption_tag: string | null;
          id: string;
          notes_ciphertext: string | null;
          reviewed_at: string;
          screening_id: string;
          trainer_id: string;
        };
        Insert: {
          decision: string;
          encryption_iv?: string | null;
          encryption_key_version?: number | null;
          encryption_tag?: string | null;
          id?: string;
          notes_ciphertext?: string | null;
          reviewed_at?: string;
          screening_id: string;
          trainer_id: string;
        };
        Update: {
          decision?: string;
          encryption_iv?: string | null;
          encryption_key_version?: number | null;
          encryption_tag?: string | null;
          id?: string;
          notes_ciphertext?: string | null;
          reviewed_at?: string;
          screening_id?: string;
          trainer_id?: string;
        };
        Relationships: [];
      };
      health_screenings: {
        Row: {
          client_id: string;
          consent_version: string;
          content_hash: string;
          created_at: string;
          encryption_iv: string;
          encryption_key_version: number;
          encryption_tag: string;
          expires_at: string;
          has_critical_risk: boolean;
          id: string;
          payload_ciphertext: string;
          privacy_notice_version: string;
          questionnaire_version: string;
          submitted_at: string;
          version: number;
        };
        Insert: {
          client_id: string;
          consent_version: string;
          content_hash: string;
          created_at?: string;
          encryption_iv: string;
          encryption_key_version?: number;
          encryption_tag: string;
          expires_at: string;
          has_critical_risk: boolean;
          id?: string;
          payload_ciphertext: string;
          privacy_notice_version: string;
          questionnaire_version?: string;
          submitted_at?: string;
          version: number;
        };
        Update: {
          client_id?: string;
          consent_version?: string;
          content_hash?: string;
          created_at?: string;
          encryption_iv?: string;
          encryption_key_version?: number;
          encryption_tag?: string;
          expires_at?: string;
          has_critical_risk?: boolean;
          id?: string;
          payload_ciphertext?: string;
          privacy_notice_version?: string;
          questionnaire_version?: string;
          submitted_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      exercise_body_zones: {
        Row: {
          body_zone_id: string;
          exercise_id: string;
        };
        Insert: {
          body_zone_id: string;
          exercise_id: string;
        };
        Update: {
          body_zone_id?: string;
          exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_body_zones_body_zone_id_fkey";
            columns: ["body_zone_id"];
            isOneToOne: false;
            referencedRelation: "body_zones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_body_zones_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_equipment: {
        Row: {
          equipment_id: string;
          exercise_id: string;
        };
        Insert: {
          equipment_id: string;
          exercise_id: string;
        };
        Update: {
          equipment_id?: string;
          exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          created_by: string | null;
          id: string;
          image_url: string | null;
          name: string;
          video_url: string | null;
        };
        Insert: {
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          video_url?: string | null;
        };
        Update: {
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      export_audit_events: {
        Row: {
          anonymized: boolean;
          approximate_size_bytes: number | null;
          client_id: string;
          created_at: string;
          export_type: string;
          id: number;
          period_end: string | null;
          period_start: string | null;
          requester_id: string;
          result: string;
          routine_id: string | null;
        };
        Insert: {
          anonymized?: boolean;
          approximate_size_bytes?: number | null;
          client_id: string;
          created_at?: string;
          export_type: string;
          id?: never;
          period_end?: string | null;
          period_start?: string | null;
          requester_id: string;
          result: string;
          routine_id?: string | null;
        };
        Update: {
          anonymized?: boolean;
          approximate_size_bytes?: number | null;
          client_id?: string;
          created_at?: string;
          export_type?: string;
          id?: never;
          period_end?: string | null;
          period_start?: string | null;
          requester_id?: string;
          result?: string;
          routine_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "export_audit_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "export_audit_events_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "export_audit_events_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          last_name: string | null;
          must_change_password: boolean;
          phone: string | null;
          register_date: string;
          role: string;
        };
        Insert: {
          birth_date?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean;
          last_name?: string | null;
          must_change_password?: boolean;
          phone?: string | null;
          register_date?: string;
          role: string;
        };
        Update: {
          birth_date?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_name?: string | null;
          must_change_password?: boolean;
          phone?: string | null;
          register_date?: string;
          role?: string;
        };
        Relationships: [];
      };
      routine_exercise_progression_rules: {
        Row: {
          client_id: string;
          created_at: string;
          deload_on_fail: boolean;
          enabled: boolean;
          failure_sessions_required: number;
          id: string;
          increment_kg: number;
          reduction_percent: number;
          routine_exercise_id: string;
          strategy: string;
          successful_sessions_required: number;
          target_effort: number | null;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          deload_on_fail?: boolean;
          enabled?: boolean;
          failure_sessions_required?: number;
          id?: string;
          increment_kg?: number;
          reduction_percent?: number;
          routine_exercise_id: string;
          strategy?: string;
          successful_sessions_required?: number;
          target_effort?: number | null;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          deload_on_fail?: boolean;
          enabled?: boolean;
          failure_sessions_required?: number;
          id?: string;
          increment_kg?: number;
          reduction_percent?: number;
          routine_exercise_id?: string;
          strategy?: string;
          successful_sessions_required?: number;
          target_effort?: number | null;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_exercise_progression_rules_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercise_progression_rules_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: true;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercise_progression_rules_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_exercise_sets: {
        Row: {
          id: string;
          is_optional: boolean;
          reps: number | null;
          reps_max: number | null;
          reps_min: number | null;
          rest_seconds: number | null;
          routine_exercise_id: string;
          set_number: number;
          set_type: string;
          training_method: string;
          target_rir: number | null;
          target_rpe: number | null;
          tempo: string | null;
          weight: number | null;
        };
        Insert: {
          id?: string;
          is_optional?: boolean;
          reps?: number | null;
          reps_max?: number | null;
          reps_min?: number | null;
          rest_seconds?: number | null;
          routine_exercise_id: string;
          set_number: number;
          set_type?: string;
          training_method?: string;
          target_rir?: number | null;
          target_rpe?: number | null;
          tempo?: string | null;
          weight?: number | null;
        };
        Update: {
          id?: string;
          is_optional?: boolean;
          reps?: number | null;
          reps_max?: number | null;
          reps_min?: number | null;
          rest_seconds?: number | null;
          routine_exercise_id?: string;
          set_number?: number;
          set_type?: string;
          training_method?: string;
          target_rir?: number | null;
          target_rpe?: number | null;
          tempo?: string | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_exercise_sets_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_exercise_substitutions: {
        Row: {
          created_at: string;
          id: string;
          routine_exercise_id: string;
          substitute_exercise_id: string;
          trainer_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          routine_exercise_id: string;
          substitute_exercise_id: string;
          trainer_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          routine_exercise_id?: string;
          substitute_exercise_id?: string;
          trainer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_exercise_substitutions_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercise_substitutions_substitute_exercise_id_fkey";
            columns: ["substitute_exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercise_substitutions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_exercises: {
        Row: {
          day_number: number;
          exercise_id: string;
          id: string;
          order_index: number;
          routine_id: string;
          technique_notes: string | null;
        };
        Insert: {
          day_number?: number;
          exercise_id: string;
          id?: string;
          order_index?: number;
          routine_id: string;
          technique_notes?: string | null;
        };
        Update: {
          day_number?: number;
          exercise_id?: string;
          id?: string;
          order_index?: number;
          routine_id?: string;
          technique_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_progression_suggestions: {
        Row: {
          applied_routine_id: string | null;
          client_id: string;
          exercise_id: string;
          generated_at: string;
          id: string;
          proposed_reps_max: number | null;
          proposed_reps_min: number | null;
          proposed_weight: number | null;
          rationale: string;
          resolved_at: string | null;
          rule_id: string;
          source_day_number: number;
          source_order_index: number;
          source_routine_exercise_id: string;
          source_routine_id: string;
          status: string;
          strategy: string;
          trainer_id: string;
        };
        Insert: {
          applied_routine_id?: string | null;
          client_id: string;
          exercise_id: string;
          generated_at?: string;
          id?: string;
          proposed_reps_max?: number | null;
          proposed_reps_min?: number | null;
          proposed_weight?: number | null;
          rationale: string;
          resolved_at?: string | null;
          rule_id: string;
          source_day_number: number;
          source_order_index: number;
          source_routine_exercise_id: string;
          source_routine_id: string;
          status?: string;
          strategy: string;
          trainer_id: string;
        };
        Update: {
          applied_routine_id?: string | null;
          client_id?: string;
          exercise_id?: string;
          generated_at?: string;
          id?: string;
          proposed_reps_max?: number | null;
          proposed_reps_min?: number | null;
          proposed_weight?: number | null;
          rationale?: string;
          resolved_at?: string | null;
          rule_id?: string;
          source_day_number?: number;
          source_order_index?: number;
          source_routine_exercise_id?: string;
          source_routine_id?: string;
          status?: string;
          strategy?: string;
          trainer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_progression_suggestions_applied_routine_id_fkey";
            columns: ["applied_routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercise_progression_rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_source_routine_exercise_id_fkey";
            columns: ["source_routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_source_routine_id_fkey";
            columns: ["source_routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_progression_suggestions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_templates: {
        Row: {
          created_at: string;
          days_at_week: number;
          definition: Json;
          description: string | null;
          effort_metric: string;
          id: string;
          name: string;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          days_at_week: number;
          definition: Json;
          description?: string | null;
          effort_metric?: string;
          id?: string;
          name: string;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          days_at_week?: number;
          definition?: Json;
          description?: string | null;
          effort_metric?: string;
          id?: string;
          name?: string;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_templates_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routines: {
        Row: {
          client_id: string;
          days_at_week: number | null;
          description: string | null;
          effort_metric: string;
          end_date: string | null;
          id: string;
          intensity_level: number;
          is_active: boolean;
          microcycle_id: string | null;
          name: string;
          plan_id: string;
          published_at: string | null;
          start_date: string;
          status: string;
          supersedes_routine_id: string | null;
          trainer_id: string;
          version_number: number;
        };
        Insert: {
          client_id: string;
          days_at_week?: number | null;
          description?: string | null;
          effort_metric?: string;
          end_date?: string | null;
          id?: string;
          intensity_level?: number;
          is_active?: boolean;
          microcycle_id?: string | null;
          name: string;
          plan_id: string;
          published_at?: string | null;
          start_date: string;
          status?: string;
          supersedes_routine_id?: string | null;
          trainer_id: string;
          version_number?: number;
        };
        Update: {
          client_id?: string;
          days_at_week?: number | null;
          description?: string | null;
          effort_metric?: string;
          end_date?: string | null;
          id?: string;
          intensity_level?: number;
          is_active?: boolean;
          microcycle_id?: string | null;
          name?: string;
          plan_id?: string;
          published_at?: string | null;
          start_date?: string;
          status?: string;
          supersedes_routine_id?: string | null;
          trainer_id?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "routines_microcycle_id_fkey";
            columns: ["microcycle_id"];
            isOneToOne: false;
            referencedRelation: "training_microcycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routines_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routines_supersedes_routine_id_fkey";
            columns: ["supersedes_routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routines_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_workouts: {
        Row: {
          client_id: string;
          created_at: string;
          day_number: number;
          id: string;
          notes: string | null;
          routine_id: string;
          scheduled_date: string;
          status: string;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          day_number: number;
          id?: string;
          notes?: string | null;
          routine_id: string;
          scheduled_date: string;
          status?: string;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          day_number?: number;
          id?: string;
          notes?: string | null;
          routine_id?: string;
          scheduled_date?: string;
          status?: string;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_workouts_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_workouts_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_client_private_contexts: {
        Row: {
          client_id: string;
          created_at: string;
          goals: string;
          private_notes: string;
          restrictions: string;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          goals?: string;
          private_notes?: string;
          restrictions?: string;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          goals?: string;
          private_notes?: string;
          restrictions?: string;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_client_private_contexts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_client_private_contexts_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_client_exercise_notes: {
        Row: {
          client_id: string;
          created_at: string;
          exercise_id: string;
          id: string;
          technical_notes: string;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          exercise_id: string;
          id?: string;
          technical_notes: string;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          exercise_id?: string;
          id?: string;
          technical_notes?: string;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_client_exercise_notes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_client_exercise_notes_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_client_exercise_notes_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_client_messages: {
        Row: {
          body: string;
          client_id: string;
          id: string;
          read_at: string | null;
          sender_id: string;
          sent_at: string;
          trainer_id: string;
        };
        Insert: {
          body: string;
          client_id: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
          sent_at?: string;
          trainer_id: string;
        };
        Update: {
          body?: string;
          client_id?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
          sent_at?: string;
          trainer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_client_messages_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_client_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_client_messages_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_clients: {
        Row: {
          client_id: string;
          end_date: string | null;
          id: string;
          is_active: boolean;
          start_date: string;
          trainer_id: string;
        };
        Insert: {
          client_id: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          start_date?: string;
          trainer_id: string;
        };
        Update: {
          client_id?: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          start_date?: string;
          trainer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainer_clients_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trainer_clients_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_session_feedback: {
        Row: {
          client_id: string;
          client_note: string | null;
          created_at: string;
          energy: number | null;
          session_id: string;
          session_rpe: number | null;
          soreness_description: string | null;
          soreness_level: number | null;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          client_note?: string | null;
          created_at?: string;
          energy?: number | null;
          session_id: string;
          session_rpe?: number | null;
          soreness_description?: string | null;
          soreness_level?: number | null;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          client_note?: string | null;
          created_at?: string;
          energy?: number | null;
          session_id?: string;
          session_rpe?: number | null;
          soreness_description?: string | null;
          soreness_level?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_session_feedback_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_feedback_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_session_sets: {
        Row: {
          actual_rir: number | null;
          actual_rpe: number | null;
          client_notes: string | null;
          completed: boolean;
          deviation_reason: string | null;
          executed_exercise_id: string | null;
          exercise_id: string;
          id: string;
          planned_is_optional: boolean;
          planned_reps_max: number | null;
          planned_reps_min: number | null;
          planned_set_type: string;
          planned_training_method: string;
          planned_target_rir: number | null;
          planned_target_rpe: number | null;
          planned_tempo: string | null;
          planned_weight: number | null;
          reps: number | null;
          routine_exercise_id: string | null;
          set_number: number;
          substitution_id: string | null;
          weight: number | null;
          workout_session_id: string;
        };
        Insert: {
          actual_rir?: number | null;
          actual_rpe?: number | null;
          client_notes?: string | null;
          completed?: boolean;
          deviation_reason?: string | null;
          executed_exercise_id?: string | null;
          exercise_id: string;
          id?: string;
          planned_is_optional?: boolean;
          planned_reps_max?: number | null;
          planned_reps_min?: number | null;
          planned_set_type?: string;
          planned_training_method?: string;
          planned_target_rir?: number | null;
          planned_target_rpe?: number | null;
          planned_tempo?: string | null;
          planned_weight?: number | null;
          reps?: number | null;
          routine_exercise_id?: string | null;
          set_number: number;
          substitution_id?: string | null;
          weight?: number | null;
          workout_session_id: string;
        };
        Update: {
          actual_rir?: number | null;
          actual_rpe?: number | null;
          client_notes?: string | null;
          completed?: boolean;
          deviation_reason?: string | null;
          executed_exercise_id?: string | null;
          exercise_id?: string;
          id?: string;
          planned_is_optional?: boolean;
          planned_reps_max?: number | null;
          planned_reps_min?: number | null;
          planned_set_type?: string;
          planned_training_method?: string;
          planned_target_rir?: number | null;
          planned_target_rpe?: number | null;
          planned_tempo?: string | null;
          planned_weight?: number | null;
          reps?: number | null;
          routine_exercise_id?: string | null;
          set_number?: number;
          substitution_id?: string | null;
          weight?: number | null;
          workout_session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_session_sets_executed_exercise_id_fkey";
            columns: ["executed_exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_sets_routine_exercise_id_fkey";
            columns: ["routine_exercise_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_sets_substitution_id_fkey";
            columns: ["substitution_id"];
            isOneToOne: false;
            referencedRelation: "routine_exercise_substitutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_session_sets_workout_session_id_fkey";
            columns: ["workout_session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          client_id: string;
          date: string;
          day_number: number;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          notes: string | null;
          routine_id: string | null;
          scheduled_workout_id: string | null;
          started_at: string;
          status: string;
        };
        Insert: {
          client_id: string;
          date?: string;
          day_number?: number;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          notes?: string | null;
          routine_id?: string | null;
          scheduled_workout_id?: string | null;
          started_at: string;
          status?: string;
        };
        Update: {
          client_id?: string;
          date?: string;
          day_number?: number;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          notes?: string | null;
          routine_id?: string | null;
          scheduled_workout_id?: string | null;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_scheduled_workout_id_fkey";
            columns: ["scheduled_workout_id"];
            isOneToOne: false;
            referencedRelation: "scheduled_workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      training_plans: {
        Row: {
          client_id: string;
          created_at: string;
          end_date: string;
          goal: string | null;
          id: string;
          name: string;
          start_date: string;
          status: string;
          trainer_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          end_date: string;
          goal?: string | null;
          id?: string;
          name: string;
          start_date: string;
          status?: string;
          trainer_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          end_date?: string;
          goal?: string | null;
          id?: string;
          name?: string;
          start_date?: string;
          status?: string;
          trainer_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_plans_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_plans_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_mesocycles: {
        Row: {
          created_at: string;
          end_date: string;
          focus: string;
          id: string;
          intensity_level: number;
          name: string;
          objective: string | null;
          position: number;
          start_date: string;
          training_plan_id: string;
          updated_at: string;
          volume_level: number;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          focus: string;
          id?: string;
          intensity_level: number;
          name: string;
          objective?: string | null;
          position: number;
          start_date: string;
          training_plan_id: string;
          updated_at?: string;
          volume_level: number;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          focus?: string;
          id?: string;
          intensity_level?: number;
          name?: string;
          objective?: string | null;
          position?: number;
          start_date?: string;
          training_plan_id?: string;
          updated_at?: string;
          volume_level?: number;
        };
        Relationships: [
          {
            foreignKeyName: "training_mesocycles_training_plan_id_fkey";
            columns: ["training_plan_id"];
            isOneToOne: false;
            referencedRelation: "training_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      training_microcycles: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          intensity_level: number;
          load_type: string;
          mesocycle_id: string;
          objective: string | null;
          position: number;
          start_date: string;
          training_plan_id: string;
          updated_at: string;
          volume_level: number;
          week_number: number;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          intensity_level: number;
          load_type?: string;
          mesocycle_id: string;
          objective?: string | null;
          position: number;
          start_date: string;
          training_plan_id: string;
          updated_at?: string;
          volume_level: number;
          week_number: number;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          intensity_level?: number;
          load_type?: string;
          mesocycle_id?: string;
          objective?: string | null;
          position?: number;
          start_date?: string;
          training_plan_id?: string;
          updated_at?: string;
          volume_level?: number;
          week_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "training_microcycles_mesocycle_id_training_plan_id_fkey";
            columns: ["mesocycle_id", "training_plan_id"];
            isOneToOne: false;
            referencedRelation: "training_mesocycles";
            referencedColumns: ["id", "training_plan_id"];
          },
          {
            foreignKeyName: "training_microcycles_training_plan_id_fkey";
            columns: ["training_plan_id"];
            isOneToOne: false;
            referencedRelation: "training_plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_encrypted_health_screening: {
        Args: {
          p_client_id: string;
          p_has_critical_risk: boolean;
          p_encrypted: Json;
          p_content_hash: string;
        };
        Returns: string;
      };
      record_encrypted_health_review: {
        Args: {
          p_trainer_id: string;
          p_client_id: string;
          p_screening_id: string;
          p_decision: string;
          p_encrypted: Json;
        };
        Returns: string;
      };
      save_exercise_catalog: {
        Args: {
          p_exercise_id: string | null;
          p_name: string;
          p_image_url: string | null;
          p_video_url: string | null;
          p_body_zone_ids: string[];
          p_equipment_ids: string[];
        };
        Returns: string;
      };
      list_trainer_client_summaries: {
        Args: Record<string, never>;
        Returns: Json[];
      };
      list_trainer_health_summaries: {
        Args: Record<string, never>;
        Returns: {
          client_id: string;
          first_name: string | null;
          last_name: string | null;
          screening_id: string | null;
          version: number | null;
          has_critical_risk: boolean | null;
          submitted_at: string | null;
          expires_at: string | null;
          decision: string | null;
        }[];
      };

      activate_periodization_plan: {
        Args: { p_plan_id: string };
        Returns: string;
      };
      archive_periodization_plan: {
        Args: { p_plan_id: string };
        Returns: string;
      };
      abandon_workout_session: {
        Args: { p_session_id: string };
        Returns: string;
      };
      apply_exercise_substitution: {
        Args: {
          p_substitute_exercise_id: string;
          p_workout_session_set_id: string;
        };
        Returns: string;
      };
      apply_progression_suggestion: {
        Args: {
          p_manual_reps_max?: number;
          p_manual_reps_min?: number;
          p_manual_weight?: number | null;
          p_suggestion_id: string;
        };
        Returns: string;
      };
      archive_routine_version: {
        Args: { p_routine_id: string };
        Returns: string;
      };
      assign_client_to_trainer: {
        Args: { p_client_id: string; p_trainer_id: string };
        Returns: string;
      };
      clone_routine_version: {
        Args: { p_source_routine_id: string };
        Returns: string;
      };
      complete_workout_session: {
        Args: {
          p_client_note: string;
          p_energy: number | null;
          p_session_id: string;
          p_session_rpe: number | null;
          p_soreness_description: string;
          p_soreness_level: number | null;
        };
        Returns: string;
      };
      deactivate_user_profile: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      list_client_assignments: {
        Args: never;
        Returns: {
          active_routine_id: string;
          active_routine_name: string;
          assignment_id: string;
          client_email: string;
          client_first_name: string;
          client_id: string;
          client_last_name: string;
          client_phone: string;
          start_date: string;
          trainer_first_name: string;
          trainer_id: string;
          trainer_last_name: string;
        }[];
      };
      list_exercise_history_overview: {
        Args: { p_client_id: string };
        Returns: {
          exercise_id: string;
          exercise_name: string;
          last_performed_at: string;
          max_estimated_1rm: number;
          max_weight: number;
          session_count: number;
          total_volume: number;
          work_set_count: number;
        }[];
      };
      list_exercise_history_page: {
        Args: {
          p_client_id: string;
          p_exercise_id: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          actual_rir: number;
          actual_rpe: number;
          estimated_1rm: number;
          is_warmup: boolean;
          performed_at: string;
          reps: number;
          session_id: string;
          set_id: string;
          set_number: number;
          set_type: string;
          volume: number;
          weight: number;
        }[];
      };
      list_exercise_rep_range_bests: {
        Args: { p_client_id: string; p_exercise_id: string };
        Returns: {
          estimated_1rm: number;
          performed_at: string;
          rep_range: string;
          reps: number;
          weight: number;
        }[];
      };
      publish_routine_version: {
        Args: { p_routine_id: string };
        Returns: string;
      };
      save_routine_draft: {
        Args: {
          p_client_id: string;
          p_days_at_week: number;
          p_description: string | null;
          p_effort_metric: string;
          p_end_date: string | null;
          p_exercises: Json;
          p_name: string;
          p_routine_id: string | null;
          p_start_date: string;
          p_training_methods: Json;
        };
        Returns: string;
      };
      save_periodization_plan: {
        Args: {
          p_client_id: string;
          p_goal: string;
          p_mesocycles: Json;
          p_name: string;
          p_plan_id: string | null;
          p_start_date: string;
        };
        Returns: string;
      };
      save_trainer_routine: {
        Args: {
          p_client_id: string;
          p_days_at_week: number;
          p_description: string;
          p_end_date: string;
          p_exercises: Json;
          p_is_active: boolean;
          p_name: string;
          p_routine_id: string;
          p_start_date: string;
        };
        Returns: string;
      };
      skip_scheduled_workout: {
        Args: { p_scheduled_workout_id: string };
        Returns: string;
      };
      start_scheduled_workout: {
        Args: { p_scheduled_workout_id: string };
        Returns: string;
      };
      start_workout_session: {
        Args: { p_day_number: number; p_routine_id: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
