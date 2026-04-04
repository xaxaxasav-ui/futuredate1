-- Enable RLS on profiles table if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (public read access)
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);