'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { getCache, setCache, clearCache } from '@/lib/cache';

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
  profileLoading: boolean;
  isOnline: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isOnline: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useSupabase() {
  return useContext(SupabaseContext);
}

interface SupabaseProviderProps {
  children: ReactNode;
}

const FALLBACK_PROFILE = {
  id: '',
  username: null,
  full_name: null,
  avatar_url: null,
  bio: null,
  phone: null,
  traits: null,
  hobbies: null,
  talents: null,
  looking_for: null,
  looking_for_gender: null,
  looking_for_age_min: null,
  looking_for_age_max: null,
  looking_for_height_min: null,
  looking_for_height_max: null,
  preferences: null,
  latitude: null,
  longitude: null,
  city: null,
  birth_date: null,
  gender: null,
  height: null,
  education: null,
  occupation: null,
  languages: null,
  relationship_status: null,
  children: null,
  smoking: null,
  alcohol: null,
  photos: null,
  photos_visibility: null,
  photos_blocked_users: null,
  profile_visibility: null,
  profile_blocked_users: null,
  views_count: null,
  likes_count: null,
  favorites_count: null,
  matches_count: null,
  assessment_results: null,
  assessment_completed: null,
  is_verified: null,
  verification_photo: null,
  verification_status: null,
  created_at: new Date().toISOString(),
};

async function fetchProfileWithRetry(
  userId: string,
  signal?: AbortSignal,
  isBackgroundRefresh: boolean = false
): Promise<Profile | null> {
  const maxRetries = isBackgroundRefresh ? 1 : 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (signal?.aborted) return null;

      if (error && error.code === 'PGRST116') {
        if (signal?.aborted) return null;
        
        await supabase
          .from('profiles')
          .upsert({ id: userId, username: `user_${userId.slice(0, 8)}` });

        const retry = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (retry.data) return retry.data;
        return null;
      }

      if (error) {
        console.warn(`Profile fetch error, attempt ${attempt}/${maxRetries}:`, error.message);
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => resolve(undefined), delay);
            signal?.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        }
        continue;
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      console.warn(`Profile fetch exception, attempt ${attempt}/${maxRetries}:`, err.message);
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return null;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setProfileLoading(true);

    const cacheKey = `profile_${userId}`;
    const cachedProfile = getCache<Profile>(cacheKey);
    
    if (cachedProfile) {
      setProfile(cachedProfile);
      setProfileLoading(false);
      
      fetchProfileWithRetry(userId, abortControllerRef.current.signal, true).then(result => {
        if (result) {
          setProfile(result);
          setCache(cacheKey, result, 5 * 60 * 1000);
        }
      });
      
      return;
    }

    const result = await fetchProfileWithRetry(userId, abortControllerRef.current.signal);
    setProfileLoading(false);

    if (result) {
      setProfile(result);
      setCache(cacheKey, result, 5 * 60 * 1000);
    } else {
      setProfile({
        ...FALLBACK_PROFILE,
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;
    let authTimeout: NodeJS.Timeout;

    const initSupabase = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        clearTimeout(authTimeout);
        authTimeout = setTimeout(() => {
          if (isMounted && session?.user) {
            fetchProfile(session.user.id);
          }
        }, 100);
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
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
      if (authTimeout) clearTimeout(authTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <SupabaseContext.Provider value={{ user, session, profile, loading, profileLoading, isOnline, signOut, refreshProfile }}>
      {children}
    </SupabaseContext.Provider>
  );
}
