'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';

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

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  updateUserProfile: async () => ({ error: null }),
});

export function useFirebaseAuth() {
  return useContext(FirebaseContext);
}

interface FirebaseProviderProps {
  children: ReactNode;
}

const FALLBACK_PROFILE: Profile = {
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
  maxRetries = 3
): Promise<Profile | null> {
  const db = getFirebaseDb();
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() } as Profile;
      }
      
      return null;
    } catch (error: any) {
      console.warn(`Profile fetch error, attempt ${attempt + 1}/${maxRetries}:`, error.message);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  
  return null;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    
    const result = await fetchProfileWithRetry(userId);
    setProfileLoading(false);

    if (result) {
      setProfile(result);
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
      await fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: error.message };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    username?: string
  ): Promise<{ error: string | null }> => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userDoc = doc(db, 'profiles', result.user.uid);
      await setDoc(userDoc, {
        username: username || `user_${result.user.uid.slice(0, 8)}`,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      if (username) {
        await updateProfile(result.user, { displayName: username });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<Profile>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const db = getFirebaseDb();
      const userDoc = doc(db, 'profiles', user.uid);
      
      const updateData = {
        ...data,
        updated_at: serverTimestamp(),
      };
      
      await updateDoc(userDoc, updateData);
      await refreshProfile();
      
      return { error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { error: error.message };
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateUserProfile
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}