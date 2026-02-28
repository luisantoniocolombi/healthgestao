export interface Patient {
  id: string;
  user_id: string;
  nome_completo: string;
  nome_lowercase?: string;
  telefone: string;
  endereco?: string;
  responsavel_nome?: string;
  doenca_principal?: string;
  observacoes_gerais?: string;
  convenio?: string;
  cpf?: string;
  data_nascimento?: string;
  status: 'ativo' | 'inativo';
  archived: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Condition {
  id: string;
  user_id: string;
  patient_id: string;
  nome_condicao: string;
  data_inicio?: string;
  observacao?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalAttachment {
  id: string;
  user_id: string;
  patient_id: string;
  titulo: string;
  data_anexo?: string;
  file_path: string;
  file_url?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNote {
  id: string;
  user_id: string;
  patient_id: string;
  data_nota: string;
  texto_nota: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  patient_id: string;
  data_atendimento: string;
  hora?: string;
  texto_prontuario?: string;
  transcription_text?: string;
  transcription_engine?: string;
  transcription_confidence?: number;
  transcription_created_at?: string;
  gerar_nfe: boolean;
  profissional_parceiro_id?: string;
  percentual_parceiro?: number;
  status: 'agendado' | 'realizado' | 'cancelado';
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  patients?: { nome_completo: string };
}

export interface Receivable {
  id: string;
  user_id: string;
  patient_id: string;
  appointment_id?: string;
  data_cobranca: string;
  valor: number;
  status_pagamento: 'pendente' | 'pago' | 'cancelado';
  data_pagamento?: string;
  forma_pagamento?: string;
  observacao?: string;
  gerar_nfe: boolean;
  origem: 'manual' | 'atendimento';
  archived: boolean;
  created_at: string;
  updated_at: string;
  conta_principal_id?: string;
  profissional_id?: string;
  // Joined
  patients?: { nome_completo: string };
}

export interface Profile {
  id: string;
  nome: string;
  email?: string;
  cpf?: string;
  registro_profissional?: string;
  cor_identificacao: string;
  conta_principal_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  conta_principal_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  forma_pagamento?: string | null;
  observacao?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type AppRole = 'admin' | 'profissional';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Invitation {
  id: string;
  admin_id: string;
  email: string;
  nome_profissional?: string;
  cor_identificacao?: string;
  token: string;
  status: 'pendente' | 'aceito' | 'expirado';
  created_at: string;
  expires_at: string;
}
