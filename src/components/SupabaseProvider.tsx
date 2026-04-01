'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
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
}

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useSupabase() {
  return useContext(SupabaseContext);
}

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
      
      if (error) {
        console.warn('Profile fetch error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          console.log('Profile not found');
          return;
        }
        if (error.code === '42P01') {
          console.error('Table profiles does not exist!');
          return;
        }
        if (error.code === '406') {
          console.log('RLS blocking - trying without single()');
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId);
          if (profiles && profiles.length > 0) {
            setProfile(profiles[0]);
          }
          return;
        }
      }
      if (data && data.length > 0) {
        setProfile(data[0]);
      }
    } catch (err: any) {
      console.warn('Fetch profile exception:', err?.message || err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const initSupabase = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn('Supabase init error:', err);
        if (!isMounted) return;
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Force loading to false after timeout');
        setLoading(false);
      }
    }, 4000);

    initSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event, session ? 'has session' : 'no session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <SupabaseContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </SupabaseContext.Provider>
  );
}
