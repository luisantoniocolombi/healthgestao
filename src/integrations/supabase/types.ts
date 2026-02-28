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
      appointments: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          data_atendimento: string
          gerar_nfe: boolean
          hora: string | null
          id: string
          patient_id: string
          percentual_parceiro: number | null
          profissional_parceiro_id: string | null
          status: string
          texto_prontuario: string | null
          transcription_confidence: number | null
          transcription_created_at: string | null
          transcription_engine: string | null
          transcription_text: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_atendimento: string
          gerar_nfe?: boolean
          hora?: string | null
          id?: string
          patient_id: string
          percentual_parceiro?: number | null
          profissional_parceiro_id?: string | null
          status?: string
          texto_prontuario?: string | null
          transcription_confidence?: number | null
          transcription_created_at?: string | null
          transcription_engine?: string | null
          transcription_text?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_atendimento?: string
          gerar_nfe?: boolean
          hora?: string | null
          id?: string
          patient_id?: string
          percentual_parceiro?: number | null
          profissional_parceiro_id?: string | null
          status?: string
          texto_prontuario?: string | null
          transcription_confidence?: number | null
          transcription_created_at?: string | null
          transcription_engine?: string | null
          transcription_text?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          data_nota: string
          id: string
          patient_id: string
          texto_nota: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_nota: string
          id?: string
          patient_id: string
          texto_nota: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_nota?: string
          id?: string
          patient_id?: string
          texto_nota?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          data_inicio: string | null
          id: string
          nome_condicao: string
          observacao: string | null
          patient_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          id?: string
          nome_condicao: string
          observacao?: string | null
          patient_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          id?: string
          nome_condicao?: string
          observacao?: string | null
          patient_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          archived: boolean
          categoria: string
          conta_principal_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          archived?: boolean
          categoria?: string
          conta_principal_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          archived?: boolean
          categoria?: string
          conta_principal_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      invitations: {
        Row: {
          admin_id: string
          cor_identificacao: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          nome_profissional: string | null
          status: string
          token: string
        }
        Insert: {
          admin_id: string
          cor_identificacao?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          nome_profissional?: string | null
          status?: string
          token?: string
        }
        Update: {
          admin_id?: string
          cor_identificacao?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          nome_profissional?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      medical_attachments: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          data_anexo: string | null
          file_path: string
          file_url: string | null
          id: string
          patient_id: string
          titulo: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_anexo?: string | null
          file_path: string
          file_url?: string | null
          id?: string
          patient_id: string
          titulo: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_anexo?: string | null
          file_path?: string
          file_url?: string | null
          id?: string
          patient_id?: string
          titulo?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          archived: boolean
          convenio: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          data_nascimento: string | null
          doenca_principal: string | null
          endereco: string | null
          id: string
          nome_completo: string
          nome_lowercase: string | null
          observacoes_gerais: string | null
          responsavel_nome: string | null
          status: string
          telefone: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          convenio?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          doenca_principal?: string | null
          endereco?: string | null
          id?: string
          nome_completo: string
          nome_lowercase?: string | null
          observacoes_gerais?: string | null
          responsavel_nome?: string | null
          status?: string
          telefone: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          convenio?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          doenca_principal?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          nome_lowercase?: string | null
          observacoes_gerais?: string | null
          responsavel_nome?: string | null
          status?: string
          telefone?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          conta_principal_id: string
          cor_identificacao: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          registro_profissional: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          conta_principal_id: string
          cor_identificacao?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          registro_profissional?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          conta_principal_id?: string
          cor_identificacao?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          registro_profissional?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          appointment_id: string | null
          archived: boolean
          created_at: string
          created_by: string | null
          data_cobranca: string
          data_pagamento: string | null
          forma_pagamento: string | null
          gerar_nfe: boolean
          id: string
          observacao: string | null
          origem: string
          patient_id: string
          status_pagamento: string
          updated_at: string
          updated_by: string | null
          user_id: string
          valor: number
        }
        Insert: {
          appointment_id?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_cobranca: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          gerar_nfe?: boolean
          id?: string
          observacao?: string | null
          origem?: string
          patient_id: string
          status_pagamento?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          valor: number
        }
        Update: {
          appointment_id?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string | null
          data_cobranca?: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          gerar_nfe?: boolean
          id?: string
          observacao?: string | null
          origem?: string
          patient_id?: string
          status_pagamento?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receivables_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      get_my_conta_principal_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_same_account: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "profissional"
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
      app_role: ["admin", "profissional"],
    },
  },
} as const
