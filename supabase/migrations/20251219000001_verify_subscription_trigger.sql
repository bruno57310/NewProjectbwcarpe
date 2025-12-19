-- Verify trigger function exists and is attached
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'Missing trigger: on_auth_user_created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, email)
      VALUES (NEW.id, NEW.email)
      ON CONFLICT (id) DO NOTHING;
      
      INSERT INTO public.subscriptions (login_id, tier, active)
      VALUES (NEW.id, 'free', true)
      ON CONFLICT (login_id) DO NOTHING;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
