-- Set vbhupeshkumar@gmail.com as admin
-- First check if user exists and get their user_id from auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user_id for vbhupeshkumar@gmail.com from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'vbhupeshkumar@gmail.com';

  -- Only insert if user exists and doesn't already have admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;