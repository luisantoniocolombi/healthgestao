
-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users manage own patients" ON public.patients;
DROP POLICY IF EXISTS "Users manage own conditions" ON public.conditions;
DROP POLICY IF EXISTS "Users manage own medical_attachments" ON public.medical_attachments;
DROP POLICY IF EXISTS "Users manage own clinical_notes" ON public.clinical_notes;
DROP POLICY IF EXISTS "Users manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users manage own receivables" ON public.receivables;

-- Recreate as PERMISSIVE policies (default type)
CREATE POLICY "Users manage own patients" ON public.patients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own conditions" ON public.conditions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own medical_attachments" ON public.medical_attachments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own clinical_notes" ON public.clinical_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own appointments" ON public.appointments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own receivables" ON public.receivables
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
