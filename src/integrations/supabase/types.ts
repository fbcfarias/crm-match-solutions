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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agentes_ia: {
        Row: {
          ativo: boolean | null
          configuracoes: Json | null
          created_at: string
          id: string
          prompt_personalizado: string
          updated_at: string
          vendedor_id: string
        }
        Insert: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          id?: string
          prompt_personalizado: string
          updated_at?: string
          vendedor_id: string
        }
        Update: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          id?: string
          prompt_personalizado?: string
          updated_at?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentes_ia_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          agendamento: string | null
          carteiras: Database["public"]["Enums"]["carteira_type"][]
          created_at: string | null
          criado_por: string
          id: string
          mensagem: string
          nome: string
          status: Database["public"]["Enums"]["campanha_status"] | null
          total_entregues: number | null
          total_enviados: number | null
          total_lidos: number | null
          updated_at: string | null
        }
        Insert: {
          agendamento?: string | null
          carteiras: Database["public"]["Enums"]["carteira_type"][]
          created_at?: string | null
          criado_por: string
          id?: string
          mensagem: string
          nome: string
          status?: Database["public"]["Enums"]["campanha_status"] | null
          total_entregues?: number | null
          total_enviados?: number | null
          total_lidos?: number | null
          updated_at?: string | null
        }
        Update: {
          agendamento?: string | null
          carteiras?: Database["public"]["Enums"]["carteira_type"][]
          created_at?: string | null
          criado_por?: string
          id?: string
          mensagem?: string
          nome?: string
          status?: Database["public"]["Enums"]["campanha_status"] | null
          total_entregues?: number | null
          total_enviados?: number | null
          total_lidos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          lida: boolean | null
          mensagem: string
          metadata: Json | null
          tipo: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          lida?: boolean | null
          mensagem: string
          metadata?: Json | null
          tipo: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          lida?: boolean | null
          mensagem?: string
          metadata?: Json | null
          tipo?: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "conversas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_ia: {
        Row: {
          agente_id: string
          created_at: string
          id: string
          lead_id: string
          mensagem: string
          metadata: Json | null
          score_qualificacao: number | null
          tipo: string
          transferido: boolean | null
        }
        Insert: {
          agente_id: string
          created_at?: string
          id?: string
          lead_id: string
          mensagem: string
          metadata?: Json | null
          score_qualificacao?: number | null
          tipo: string
          transferido?: boolean | null
        }
        Update: {
          agente_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          mensagem?: string
          metadata?: Json | null
          score_qualificacao?: number | null
          tipo?: string
          transferido?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_ia_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes_ia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_ia_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          canal: Database["public"]["Enums"]["canal_type"] | null
          cliente_id: string | null
          created_at: string | null
          email: string | null
          empresa: string | null
          id: string
          nome: string
          notas: string | null
          score: number | null
          status: Database["public"]["Enums"]["lead_status"] | null
          telefone: string | null
          ultima_interacao: string | null
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal_type"] | null
          cliente_id?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          notas?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_type"] | null
          cliente_id?: string | null
          created_at?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          notas?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefone?: string | null
          ultima_interacao?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas: {
        Row: {
          conversoes: number | null
          created_at: string | null
          data: string | null
          id: string
          leads_gerados: number | null
          revenue: number | null
          vendedor_id: string
        }
        Insert: {
          conversoes?: number | null
          created_at?: string | null
          data?: string | null
          id?: string
          leads_gerados?: number | null
          revenue?: number | null
          vendedor_id: string
        }
        Update: {
          conversoes?: number | null
          created_at?: string | null
          data?: string | null
          id?: string
          leads_gerados?: number | null
          revenue?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metricas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agente_ativo: boolean | null
          avatar_url: string | null
          carteira: Database["public"]["Enums"]["carteira_type"] | null
          contexto_agente_ia: string | null
          created_at: string | null
          email: string
          estilo_comunicacao: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          agente_ativo?: boolean | null
          avatar_url?: string | null
          carteira?: Database["public"]["Enums"]["carteira_type"] | null
          contexto_agente_ia?: string | null
          created_at?: string | null
          email: string
          estilo_comunicacao?: string | null
          id?: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          agente_ativo?: boolean | null
          avatar_url?: string | null
          carteira?: Database["public"]["Enums"]["carteira_type"] | null
          contexto_agente_ia?: string | null
          created_at?: string | null
          email?: string
          estilo_comunicacao?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      qualificacao_leads: {
        Row: {
          created_at: string
          criterios_atendidos: Json | null
          id: string
          lead_id: string
          motivo_transferencia: string | null
          score_atual: number | null
          status_qualificacao: string | null
          transferido_em: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterios_atendidos?: Json | null
          id?: string
          lead_id: string
          motivo_transferencia?: string | null
          score_atual?: number | null
          status_qualificacao?: string | null
          transferido_em?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterios_atendidos?: Json | null
          id?: string
          lead_id?: string
          motivo_transferencia?: string | null
          score_atual?: number | null
          status_qualificacao?: string | null
          transferido_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualificacao_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
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
      campanha_status:
        | "rascunho"
        | "agendada"
        | "em_execucao"
        | "concluida"
        | "cancelada"
      canal_type: "whatsapp" | "email" | "telefone" | "site"
      carteira_type: "A" | "B" | "C" | "D" | "E" | "F"
      lead_status:
        | "novo"
        | "qualificado"
        | "em_negociacao"
        | "fechado"
        | "perdido"
      mensagem_tipo: "enviada" | "recebida" | "sistema"
      user_role: "admin" | "vendedor" | "agente"
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
      campanha_status: [
        "rascunho",
        "agendada",
        "em_execucao",
        "concluida",
        "cancelada",
      ],
      canal_type: ["whatsapp", "email", "telefone", "site"],
      carteira_type: ["A", "B", "C", "D", "E", "F"],
      lead_status: [
        "novo",
        "qualificado",
        "em_negociacao",
        "fechado",
        "perdido",
      ],
      mensagem_tipo: ["enviada", "recebida", "sistema"],
      user_role: ["admin", "vendedor", "agente"],
    },
  },
} as const
