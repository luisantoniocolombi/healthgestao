CREATE POLICY "Admins update appointments in same account"
ON public.appointments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND is_same_account(user_id));