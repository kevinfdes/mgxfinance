-- Enums
CREATE TYPE public.inquiry_status AS ENUM ('submitted','under_review','approved','rejected','funded');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','refunded');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: select own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Investment inquiries
CREATE TABLE public.investment_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_name TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  contact_phone TEXT,
  message TEXT,
  status public.inquiry_status NOT NULL DEFAULT 'submitted',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX investment_inquiries_user_id_idx ON public.investment_inquiries(user_id);

GRANT SELECT, INSERT ON public.investment_inquiries TO authenticated;
GRANT ALL ON public.investment_inquiries TO service_role;

ALTER TABLE public.investment_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inquiries: select own" ON public.investment_inquiries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Submitters can only insert with their own user_id, and only with default status/payment values
CREATE POLICY "Inquiries: insert own" ON public.investment_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'submitted'
    AND payment_status = 'pending'
    AND stripe_session_id IS NULL
  );

CREATE TRIGGER inquiries_set_updated_at BEFORE UPDATE ON public.investment_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();