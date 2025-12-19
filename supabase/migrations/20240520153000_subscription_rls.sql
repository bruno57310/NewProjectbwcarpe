-- Enable RLS if not already active
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see THEIR OWN subscriptions
CREATE POLICY "User can view own subscriptions"
ON public.subscriptions
FOR SELECT USING (
  login_id = auth.uid()
);

-- Policy: Authenticated users can create subscriptions
CREATE POLICY "Authenticated can create subscriptions"
ON public.subscriptions
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  login_id = auth.uid()
);
