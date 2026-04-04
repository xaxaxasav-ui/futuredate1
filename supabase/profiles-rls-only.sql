-- Allow anyone to read profiles (public read access)
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Enable RLS on profile_views if not already
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own views
DROP POLICY IF EXISTS "Users can read own profile_views" ON public.profile_views;
CREATE POLICY "Users can read own profile_views" ON public.profile_views
  FOR SELECT
  USING (viewer_id = auth.uid());

-- Allow users to delete their own views
DROP POLICY IF EXISTS "Users can delete own profile_views" ON public.profile_views;
CREATE POLICY "Users can delete own profile_views" ON public.profile_views
  FOR DELETE
  USING (viewer_id = auth.uid());