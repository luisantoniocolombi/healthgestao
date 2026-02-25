
-- Admin can UPDATE patients in same account
CREATE POLICY "Admins update patients in same account"
ON public.patients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id));

-- Admin can INSERT patients for professionals in same account
CREATE POLICY "Admins insert patients in same account"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id));

-- Admin can UPDATE receivables in same account
CREATE POLICY "Admins update receivables in same account"
ON public.receivables
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id));
