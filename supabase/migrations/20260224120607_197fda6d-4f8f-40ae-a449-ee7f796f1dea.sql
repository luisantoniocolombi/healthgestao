
-- Helper function to get current user's conta_principal_id
CREATE OR REPLACE FUNCTION public.get_my_conta_principal_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conta_principal_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper function to check if a user_id belongs to the same account
CREATE OR REPLACE FUNCTION public.is_same_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id
    AND conta_principal_id = (SELECT conta_principal_id FROM profiles WHERE id = auth.uid())
  )
$$;

-- PATIENTS: shared across entire clinic account
DROP POLICY IF EXISTS "Users manage own patients" ON patients;
CREATE POLICY "Same account can read patients" ON patients FOR SELECT
  USING (is_same_account(user_id));
CREATE POLICY "Users insert own patients" ON patients FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own patients" ON patients FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own patients" ON patients FOR DELETE
  USING (user_id = auth.uid());

-- APPOINTMENTS: admin sees all in account, professional sees own
DROP POLICY IF EXISTS "Users manage own appointments" ON appointments;
CREATE POLICY "Users manage own appointments" ON appointments FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read all appointments" ON appointments FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND is_same_account(user_id));

-- RECEIVABLES: admin sees all in account, professional sees own
DROP POLICY IF EXISTS "Users manage own receivables" ON receivables;
CREATE POLICY "Users manage own receivables" ON receivables FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read all receivables" ON receivables FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND is_same_account(user_id));

-- CLINICAL_NOTES: shared across clinic
DROP POLICY IF EXISTS "Users manage own clinical_notes" ON clinical_notes;
CREATE POLICY "Same account can read clinical_notes" ON clinical_notes FOR SELECT
  USING (is_same_account(user_id));
CREATE POLICY "Users insert own clinical_notes" ON clinical_notes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own clinical_notes" ON clinical_notes FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own clinical_notes" ON clinical_notes FOR DELETE
  USING (user_id = auth.uid());

-- CONDITIONS: shared across clinic
DROP POLICY IF EXISTS "Users manage own conditions" ON conditions;
CREATE POLICY "Same account can read conditions" ON conditions FOR SELECT
  USING (is_same_account(user_id));
CREATE POLICY "Users insert own conditions" ON conditions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own conditions" ON conditions FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own conditions" ON conditions FOR DELETE
  USING (user_id = auth.uid());

-- MEDICAL_ATTACHMENTS: shared across clinic
DROP POLICY IF EXISTS "Users manage own medical_attachments" ON medical_attachments;
CREATE POLICY "Same account can read medical_attachments" ON medical_attachments FOR SELECT
  USING (is_same_account(user_id));
CREATE POLICY "Users insert own medical_attachments" ON medical_attachments FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own medical_attachments" ON medical_attachments FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own medical_attachments" ON medical_attachments FOR DELETE
  USING (user_id = auth.uid());
