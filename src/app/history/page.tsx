"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Clock, Eye, Heart, Star, MessageCircle } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

interface ViewedProfile {
  id: string;
  profile_id: string;
  viewer_id: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string;
    age: number;
    city: string;
    avatar_url: string;
  };
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [views, setViews] = useState<ViewedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      console.log('User ID for history:', user.id);
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      console.log('Loading history for user:', user.id);
      
      // Step 1: Get profile_view records
      const { data: profileViewsData, error: viewsError } = await supabase
        .from('profile_views')
        .select('profile_id, viewer_id, created_at')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      console.log('Profile views:', profileViewsData, 'Error:', viewsError);

      if (!profileViewsData || profileViewsData.length === 0) {
        setViews([]);
        setLoading(false);
        return;
      }

      // Step 2: Extract unique profile IDs
      const profileIds = [...new Set(profileViewsData.map(v => v.profile_id))];
      console.log('Profile IDs to fetch:', profileIds);

      // Try fetching with Supabase client after RLS fix
      // First test - simple query to check if profiles table is accessible
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      console.log('Test query result:', testData, 'Error:', testError);
      
      // Now fetch specific profile
      for (const profileId of profileIds) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, city, avatar_url, birth_date')
            .eq('id', profileId)
            .single();
          
          console.log(`Profile for ${profileId}:`, profileData, 'Error:', profileError);
          
          if (profileData) {
            let age = null;
            if (profileData.birth_date) {
              const birth = new Date(profileData.birth_date);
              const today = new Date();
              age = Math.floor((today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            }
            profilesMap[profileId] = { ...profileData, age };
          }
        } catch (e) {
          console.log('Error fetching profile', profileId, e);
        }
      }

      console.log('Profiles map:', profilesMap);

      // Step 4: Combine data
      const viewsWithProfiles = profileViewsData.map((v) => ({
        id: v.profile_id,
        profile_id: v.profile_id,
        viewer_id: v.viewer_id,
        created_at: v.created_at,
        profile: profilesMap[v.profile_id] || {
          id: v.profile_id,
          full_name: 'Пользователь',
          age: null,
          city: '',
          avatar_url: null
        }
      }));

      console.log('Setting views:', viewsWithProfiles);
      setViews(viewsWithProfiles);
    } catch (e) {
      console.error('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen pt-20 pb-6 px-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-6 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-3">
            <Clock className="w-8 h-8" />
            История
          </h1>
          <p className="text-muted-foreground">Просмотренные профили</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : views.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Eye className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">История пуста</h3>
            <p className="text-muted-foreground">
              Здесь будет отображаться история просмотренных профилей.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {views.map((view) => (
              <Link key={view.id} href={`/profile/${view.profile_id}`}>
                <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                    {view.profile?.avatar_url ? (
                      <img 
                        src={view.profile.avatar_url} 
                        alt={view.profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {view.profile?.full_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {view.profile?.full_name || 'Пользователь'}
                      {view.profile?.age && `, ${view.profile.age}`}
                    </h3>
                    {view.profile?.city && (
                      <p className="text-sm text-muted-foreground">{view.profile.city}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(view.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}