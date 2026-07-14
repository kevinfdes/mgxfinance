
CREATE TABLE public.pluggy_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  connector_id integer,
  connector_name text,
  connector_image_url text,
  status text NOT NULL DEFAULT 'UPDATING',
  execution_status text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pluggy_items TO authenticated;
GRANT ALL ON public.pluggy_items TO service_role;

ALTER TABLE public.pluggy_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pluggy items: select own" ON public.pluggy_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Pluggy items: insert own" ON public.pluggy_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pluggy items: update own" ON public.pluggy_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pluggy items: delete own" ON public.pluggy_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER pluggy_items_updated_at BEFORE UPDATE ON public.pluggy_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
