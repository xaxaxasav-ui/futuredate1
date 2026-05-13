"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Star, User, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
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
    
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`/api/favorites?userId=${user.id}`);
        const result = await response.json();
        
        if (response.ok && result.favorites) {
          setFavorites(result.favorites);
          setLoading(false);
          return;
        }
        
        lastError = result.error || 'Failed to fetch favorites';
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    
    console.error('Error fetching favorites:', lastError);
    setLoading(false);
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
              <Link key={profile.id} href={`/user/${profile.id}`}>
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
