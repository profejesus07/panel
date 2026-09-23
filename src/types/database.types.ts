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
      absence_justifications: {
        Row: {
          absence_date: string
          attachment_url: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["justification_status"]
          student_id: string
          submitted_by: string
        }
        Insert: {
          absence_date: string
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["justification_status"]
          student_id: string
          submitted_by: string
        }
        Update: {
          absence_date?: string
          attachment_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["justification_status"]
          student_id?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_justifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_periods: {
        Row: {
          academic_year: string
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["course_status"]
        }
        Insert: {
          academic_year: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["course_status"]
        }
        Update: {
          academic_year?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["course_status"]
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["audience_scope"]
          content: string
          course_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          publish_at: string
          status: Database["public"]["Enums"]["announcement_status"]
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_scope"]
          content: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          publish_at?: string
          status?: Database["public"]["Enums"]["announcement_status"]
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_scope"]
          content?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          publish_at?: string
          status?: Database["public"]["Enums"]["announcement_status"]
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          course_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_records: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          record_date: string
          status: Database["public"]["Enums"]["behavior_record_status"]
          student_id: string
          title: string | null
          type: Database["public"]["Enums"]["behavior_record_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          record_date?: string
          status?: Database["public"]["Enums"]["behavior_record_status"]
          student_id: string
          title?: string | null
          type: Database["public"]["Enums"]["behavior_record_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          record_date?: string
          status?: Database["public"]["Enums"]["behavior_record_status"]
          student_id?: string
          title?: string | null
          type?: Database["public"]["Enums"]["behavior_record_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_year: string
          created_at: string
          grade: string
          group_name: string
          id: string
          shift: Database["public"]["Enums"]["course_shift"]
          status: Database["public"]["Enums"]["course_status"]
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade: string
          group_name: string
          id?: string
          shift?: Database["public"]["Enums"]["course_shift"]
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade?: string
          group_name?: string
          id?: string
          shift?: Database["public"]["Enums"]["course_shift"]
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Relationships: []
      }
      grade_entries: {
        Row: {
          concept: string
          concept_id: string | null
          created_at: string
          created_by: string | null
          graded_at: string
          id: string
          observation: string | null
          period_id: string
          score: number
          student_id: string
          subject_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          concept: string
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          graded_at?: string
          id?: string
          observation?: string | null
          period_id: string
          score: number
          student_id: string
          subject_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          concept?: string
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          graded_at?: string
          id?: string
          observation?: string | null
          period_id?: string
          score?: number
          student_id?: string
          subject_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_entries_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "grading_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          created_by: string | null
          graded_at: string
          id: string
          observation: string | null
          period_id: string
          scale: string
          score: number
          status: Database["public"]["Enums"]["grade_status"]
          student_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          graded_at?: string
          id?: string
          observation?: string | null
          period_id: string
          scale?: string
          score: number
          status?: Database["public"]["Enums"]["grade_status"]
          student_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          graded_at?: string
          id?: string
          observation?: string | null
          period_id?: string
          scale?: string
          score?: number
          status?: Database["public"]["Enums"]["grade_status"]
          student_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_concepts: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          name: string
          period_id: string
          position: number
          subject_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          name: string
          period_id: string
          position?: number
          subject_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          name?: string
          period_id?: string
          position?: number
          subject_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grading_concepts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_concepts_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_concepts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      official_records: {
        Row: {
          audience: Database["public"]["Enums"]["audience_scope"]
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          document_url: string | null
          id: string
          number: string | null
          record_date: string
          status: Database["public"]["Enums"]["official_record_status"]
          student_id: string | null
          title: string
          type: Database["public"]["Enums"]["official_record_type"]
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_scope"]
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          number?: string | null
          record_date?: string
          status?: Database["public"]["Enums"]["official_record_status"]
          student_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["official_record_type"]
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_scope"]
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          number?: string | null
          record_date?: string
          status?: Database["public"]["Enums"]["official_record_status"]
          student_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["official_record_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_levels: {
        Row: {
          created_at: string
          id: string
          max_score: number
          min_score: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_score: number
          min_score: number
          name: string
          slug: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_score?: number
          min_score?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          academic_year: string
          address: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          motto: string | null
          name: string
          nit: string | null
          phone: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          academic_year: string
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          motto?: string | null
          name: string
          nit?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          academic_year?: string
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          motto?: string | null
          name?: string
          nit?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          is_primary: boolean
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          is_primary?: boolean
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          student_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          is_primary?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          course_id: string | null
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          email: string | null
          enrollment_date: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["student_status"]
          student_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          course_id?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          email?: string | null
          enrollment_date?: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          course_id?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          email?: string | null
          enrollment_date?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_justification: {
        Args: { p_justification_id: string; p_review_notes?: string }
        Returns: {
          absence_date: string
          attachment_url: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["justification_status"]
          student_id: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "absence_justifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_access_student: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      can_view_by_audience: {
        Args: {
          p_audience: Database["public"]["Enums"]["audience_scope"]
          p_course_id: string
          p_student_id: string
        }
        Returns: boolean
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      my_student_id: { Args: never; Returns: string }
      my_student_ids: { Args: never; Returns: string[] }
      recompute_grade: {
        Args: { p_period: string; p_student: string; p_subject: string }
        Returns: undefined
      }
      reject_justification: {
        Args: { p_justification_id: string; p_review_notes?: string }
        Returns: {
          absence_date: string
          attachment_url: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["justification_status"]
          student_id: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "absence_justifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      safe_uuid: { Args: { value: string }; Returns: string }
    }
    Enums: {
      announcement_status: "borrador" | "publicado" | "archivado"
      attendance_status: "presente" | "ausente" | "tarde" | "justificado"
      audience_scope:
        | "todos"
        | "estudiantes"
        | "padres"
        | "curso"
        | "estudiante"
      behavior_record_status: "abierto" | "en_seguimiento" | "cerrado"
      behavior_record_type:
        | "observacion"
        | "reconocimiento"
        | "compromiso"
        | "situacion_convivencia"
      course_shift: "manana" | "tarde" | "unica" | "fin_de_semana"
      course_status: "activo" | "inactivo"
      document_type: "RC" | "TI" | "CC" | "CE" | "PA"
      grade_status: "borrador" | "definitiva"
      guardian_relationship: "padre" | "madre" | "tutor" | "acudiente" | "otro"
      justification_status: "pendiente" | "aprobada" | "rechazada"
      official_record_status: "vigente" | "anulada"
      official_record_type:
        | "reunion"
        | "disciplinaria"
        | "comite"
        | "graduacion"
        | "otro"
      student_status: "activo" | "inactivo" | "retirado" | "graduado"
      user_role: "admin" | "estudiante" | "padre"
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
      announcement_status: ["borrador", "publicado", "archivado"],
      attendance_status: ["presente", "ausente", "tarde", "justificado"],
      audience_scope: ["todos", "estudiantes", "padres", "curso", "estudiante"],
      behavior_record_status: ["abierto", "en_seguimiento", "cerrado"],
      behavior_record_type: [
        "observacion",
        "reconocimiento",
        "compromiso",
        "situacion_convivencia",
      ],
      course_shift: ["manana", "tarde", "unica", "fin_de_semana"],
      course_status: ["activo", "inactivo"],
      document_type: ["RC", "TI", "CC", "CE", "PA"],
      grade_status: ["borrador", "definitiva"],
      guardian_relationship: ["padre", "madre", "tutor", "acudiente", "otro"],
      justification_status: ["pendiente", "aprobada", "rechazada"],
      official_record_status: ["vigente", "anulada"],
      official_record_type: [
        "reunion",
        "disciplinaria",
        "comite",
        "graduacion",
        "otro",
      ],
      student_status: ["activo", "inactivo", "retirado", "graduado"],
      user_role: ["admin", "estudiante", "padre"],
    },
  },
} as const

// Alias de conveniencia usado por el resto del frontend
export type UserRole = Database["public"]["Enums"]["user_role"]
