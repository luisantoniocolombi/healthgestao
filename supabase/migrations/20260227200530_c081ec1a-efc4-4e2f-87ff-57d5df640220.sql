
-- Drop existing RESTRICTIVE policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles in their account" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their account" ON public.profiles;

-- Recreate as PERMISSIVE
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles in their account"
  ON public.profiles FOR SELECT TO authenticated
  USING (conta_principal_id = get_my_conta_principal_id());

CREATE POLICY "Admins can update profiles in their account"
  ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND conta_principal_id = get_my_conta_principal_id());
