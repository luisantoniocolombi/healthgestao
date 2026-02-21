
-- ============================================
-- SISTEMA FONOAUDIÓLOGA - SCHEMA COMPLETO
-- ============================================

-- Função de atualização de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- PATIENTS
-- ============================================
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_completo TEXT NOT NULL,
  nome_lowercase TEXT GENERATED ALWAYS AS (lower(nome_completo)) STORED,
  telefone TEXT NOT NULL,
  endereco TEXT,
  responsavel_nome TEXT,
  doenca_principal TEXT,
  observacoes_gerais TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_patients_user_nome ON public.patients (user_id, nome_lowercase);
CREATE INDEX idx_patients_user_status ON public.patients (user_id, status) WHERE archived = false;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own patients" ON public.patients
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CONDITIONS
-- ============================================
CREATE TABLE public.conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nome_condicao TEXT NOT NULL,
  data_inicio DATE,
  observacao TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conditions" ON public.conditions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_conditions_updated_at
  BEFORE UPDATE ON public.conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MEDICAL ATTACHMENTS
-- ============================================
CREATE TABLE public.medical_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data_anexo DATE,
  file_path TEXT NOT NULL,
  file_url TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.medical_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own medical_attachments" ON public.medical_attachments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_medical_attachments_updated_at
  BEFORE UPDATE ON public.medical_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CLINICAL NOTES
-- ============================================
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  data_nota DATE NOT NULL,
  texto_nota TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own clinical_notes" ON public.clinical_notes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_clinical_notes_updated_at
  BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  data_atendimento DATE NOT NULL,
  hora TIME,
  texto_prontuario TEXT,
  transcription_text TEXT,
  transcription_engine TEXT,
  transcription_confidence NUMERIC,
  transcription_created_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'realizado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_appointments_user_data ON public.appointments (user_id, data_atendimento);
CREATE INDEX idx_appointments_user_patient_data ON public.appointments (user_id, patient_id, data_atendimento);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own appointments" ON public.appointments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RECEIVABLES
-- ============================================
CREATE TABLE public.receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  data_cobranca DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
  data_pagamento DATE,
  forma_pagamento TEXT,
  observacao TEXT,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'atendimento')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_receivables_user_data_status ON public.receivables (user_id, data_cobranca, status_pagamento);
CREATE INDEX idx_receivables_user_patient ON public.receivables (user_id, patient_id);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own receivables" ON public.receivables
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-recordings', 'audio-recordings', false);

-- Storage policies - medical files
CREATE POLICY "Users upload own medical files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own medical files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own medical files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies - audio recordings
CREATE POLICY "Users upload own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
