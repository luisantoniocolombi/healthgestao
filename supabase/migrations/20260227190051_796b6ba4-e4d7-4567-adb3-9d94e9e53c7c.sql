
-- Add SELECT policy for professionals on appointments (same account)
CREATE POLICY "Professionals read same account appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (is_same_account(user_id));

-- Add SELECT policy for professionals on receivables (same account)
CREATE POLICY "Professionals read same account receivables"
  ON public.receivables
  FOR SELECT
  TO authenticated
  USING (is_same_account(user_id));
