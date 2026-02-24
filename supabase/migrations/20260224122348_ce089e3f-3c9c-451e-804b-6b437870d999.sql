
DROP POLICY IF EXISTS "Admins can read all profiles in their account" ON profiles;
CREATE POLICY "Admins can read all profiles in their account"
  ON profiles FOR SELECT
  USING (conta_principal_id = get_my_conta_principal_id());

DROP POLICY IF EXISTS "Admins can update profiles in their account" ON profiles;
CREATE POLICY "Admins can update profiles in their account"
  ON profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) AND conta_principal_id = get_my_conta_principal_id());
