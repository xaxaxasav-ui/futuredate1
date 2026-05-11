"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Star, User, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FavoriteUser {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  avatar_url: string;
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  async function fetchFavorites() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('favorited_user_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = data.map((f: any) => f.favorited_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, birth_date, bio')
        .in('id', userIds);

      if (profiles && profiles.length > 0) {
        const favoritesWithProfiles = profiles.map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Неизвестный',
          age: p.birth_date ? calculateAge(p.birth_date) : 0,
          city: p.city || '',
          bio: p.bio || '',
          avatar_url: p.avatar_url || ''
        }));
        setFavorites(favoritesWithProfiles);
      }
    }
    setLoading(false);
  }

  function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

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
            <Star className="w-8 h-8 text-yellow-400" />
            Избранное
          </h1>
          <p className="text-muted-foreground">Пользователи, которых вы добавили в избранное</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favorites.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Star className="w-16 h-16 text-yellow-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Пока нет избранных</h3>
            <p className="text-muted-foreground">
              Добавляйте понравившихся пользователей в избранное, нажав на звездочку в их профиле.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((profile) => (
              <Link key={profile.id} href={`/profile/${profile.id}`}>
                <GlassCard className="p-4 hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{profile.name}, {profile.age}</h3>
                      <p className="text-sm text-muted-foreground">{profile.city}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                    </div>
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
