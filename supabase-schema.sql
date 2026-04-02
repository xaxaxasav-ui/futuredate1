-- FutureDate AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful - this deletes data)
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.matches CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- Profiles table (updated with all fields)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  personality_vector JSONB,
  traits TEXT[],
  hobbies TEXT[],
  talents TEXT[],
  looking_for TEXT,
  looking_for_gender TEXT,
  looking_for_age_min INTEGER,
  looking_for_age_max INTEGER,
  looking_for_height_min INTEGER,
  looking_for_height_max INTEGER,
  preferences JSONB,
  latitude FLOAT,
  longitude FLOAT,
  city TEXT,
  birth_date DATE,
  gender TEXT,
  height INTEGER,
  education TEXT,
  occupation TEXT,
  languages TEXT[],
  relationship_status TEXT,
  children TEXT,
  smoking TEXT,
  alcohol TEXT,
  photos TEXT[],
  photos_visibility TEXT DEFAULT 'all',
  photos_blocked_users TEXT[],
  profile_visibility TEXT DEFAULT 'all',
  profile_blocked_users TEXT[],
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  matches_count INTEGER DEFAULT 0,
  assessment_results JSONB,
  assessment_completed BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_photo TEXT,
  verification_status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'user',
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  status TEXT DEFAULT 'pending',
  liked_at TIMESTAMP WITH TIME ZONE,
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_user_name TEXT,
  from_user_avatar TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR ALL TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

-- RLS Policies for matches
DROP POLICY IF EXISTS "Users can view own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can create matches" ON public.matches;

CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in own matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in own matches" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Users can view messages in own matches" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = messages.match_id 
      AND (m.user_id = auth.uid() OR m.matched_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own matches" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

-- RLS Policies for support_tickets
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (for admin email access)
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

-- Site settings policies
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR ALL TO authenticated USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications for others" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON public.matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);

-- Gifts table for virtual gifts between users
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  gift_name TEXT,
  gift_emoji TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gifts catalog for admin management
CREATE TABLE IF NOT EXISTS public.gifts_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default gifts if not exists
INSERT INTO gifts_catalog (id, name, emoji, is_active) VALUES
  ('rose', 'Роза', '🌹', true),
  ('heart', 'Сердце', '❤️', true),
  ('star', 'Звезда', '⭐', true),
  ('fire', 'Огонь', '🔥', true),
  ('kiss', 'Поцелуй', '💋', true),
  ('cake', 'Торт', '🎂', true),
  ('ring', 'Кольцо', '💍', true),
  ('diamond', 'Бриллиант', '💎', true),
  ('car', 'Машина', '🚗', true),
  ('house', 'Дом', '🏠', true),
  ('rocket', 'Ракета', '🚀', true),
  ('crown', 'Корона', '👑', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for gifts_catalog (public read, admin write)
ALTER TABLE public.gifts_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gifts catalog" ON public.gifts_catalog;
DROP POLICY IF EXISTS "Admins can manage gifts catalog" ON public.gifts_catalog;

CREATE POLICY "Anyone can view gifts catalog" ON public.gifts_catalog
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gifts catalog" ON public.gifts_catalog
  FOR ALL USING (
    auth.jwt()->>'email' IN ('admin@date-future.ru', 'admin@свидание-будущего.рф', 'statnihx@mail.ru')
  );

-- RLS for gifts
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sent gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can view received gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can send gifts" ON public.gifts;

CREATE POLICY "Users can view sent gifts" ON public.gifts
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can view received gifts" ON public.gifts
  FOR SELECT USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send gifts" ON public.gifts
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable realtime for messages table
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
