-- Enable INSERT on profiles table for authenticated users
CREATE POLICY "Allow authenticated users to create their profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Ensure email matches auth user's email
  auth.uid() = auth_id AND
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
