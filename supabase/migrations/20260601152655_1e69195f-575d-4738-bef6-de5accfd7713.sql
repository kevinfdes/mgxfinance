ALTER TABLE public.investment_inquiries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_inquiries;