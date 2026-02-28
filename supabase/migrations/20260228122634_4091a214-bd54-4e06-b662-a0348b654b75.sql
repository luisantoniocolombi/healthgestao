
-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from invitations for existing professionals
UPDATE public.profiles p
SET email = i.email
FROM public.invitations i
WHERE i.status = 'aceito'
  AND p.conta_principal_id = i.admin_id
  AND p.id != p.conta_principal_id
  AND p.email IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id AND lower(u.email) = lower(i.email)
  );

-- Also backfill email from auth.users for admin profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- Update trigger to save email on user creation
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, conta_principal_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.id,
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;
