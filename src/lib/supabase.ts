import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kvpdfqbbwynlxicjxqmg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cGRmcWJid3lubHhpY2p4cW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTg0NzMsImV4cCI6MjA5MDA5NDQ3M30.xNsVfBbo0FMKwnZmD9WYFo3X24OfItVReV9qBlPbs54';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  personality_vector: Record<string, unknown> | null;
  traits: string[] | null;
  hobbies: string[] | null;
  talents: string[] | null;
  looking_for: string | null;
  looking_for_gender: string | null;
  looking_for_age_min: number | null;
  looking_for_age_max: number | null;
  looking_for_height_min: number | null;
  looking_for_height_max: number | null;
  preferences: Record<string, unknown> | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  birth_date: string | null;
  gender: string | null;
  height: number | null;
  education: string | null;
  occupation: string | null;
  languages: string[] | null;
  relationship_status: string | null;
  children: string | null;
  smoking: string | null;
  alcohol: string | null;
  photos: string[] | null;
  photos_visibility: string | null;
  photos_blocked_users: string[] | null;
  profile_visibility: string | null;
  profile_blocked_users: string[] | null;
  views_count: number | null;
  likes_count: number | null;
  favorites_count: number | null;
  matches_count: number | null;
  assessment_results: Record<string, unknown> | null;
  assessment_completed: boolean | null;
  is_verified: boolean | null;
  verification_photo: string | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  compatibility_score: number | null;
  status: string;
  created_at: string;
  matched_profile?: Profile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function getMatches(userId: string): Promise<Match[]> {
  try {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matches_matched_user_id_fkey(id, username, full_name, avatar_url, bio, traits)
      `)
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .eq('status', 'accepted');
    return data || [];
  } catch (error) {
    console.warn('getMatches error:', error);
    return [];
  }
}

export async function getMessages(matchId: string): Promise<Message[]> {
  try {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    return data || [];
  } catch (error) {
    console.warn('getMessages error:', error);
    return [];
  }
}

export async function sendMessage(matchId: string, content: string, senderId: string) {
  return supabase.from('messages').insert({
    match_id: matchId,
    sender_id: senderId,
    content,
  });
}

export async function subscribeToMessages(
  matchId: string,
  callback: (payload: { eventType: string; new: Message }) => void
) {
  return supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => callback(payload as unknown as { eventType: string; new: Message })
    )
    .subscribe();
}

export async function createMatch(userId: string, matchedUserId: string, score: number) {
  return supabase.from('matches').insert({
    user_id: userId,
    matched_user_id: matchedUserId,
    compatibility_score: score,
    status: 'pending',
  });
}

export async function acceptMatch(matchId: string) {
  return supabase
    .from('matches')
    .update({ status: 'accepted' })
    .eq('id', matchId);
}

export async function getAllProfiles(excludeUserId: string): Promise<Profile[]> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', excludeUserId);
    return data || [];
  } catch (error) {
    console.warn('getAllProfiles error:', error);
    return [];
  }
}
