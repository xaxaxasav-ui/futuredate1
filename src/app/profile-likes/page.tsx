"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Heart, Loader2, User } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Liker {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar_url: string;
  created_at: string;
}

export default function ProfileLikesPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchLikers();
    }
  }, [user]);

  async function fetchLikers() {
    if (!user || !supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('likes')
      .select('liker_id, created_at')
      .eq('liked_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching likers:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const likerIds = [...new Set(data.map((l: any) => l.liker_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, birth_date')
        .in('id', likerIds);

      if (!profilesError && profiles) {
        const likersWithProfiles = data.map((l: any) => {
          const profile = profiles.find((p: any) => p.id === l.liker_id);
          const age = profile?.birth_date ? calculateAge(profile.birth_date) : 0;
          return {
            id: l.liker_id,
            name: profile?.full_name || 'Неизвестный',
            age,
            city: profile?.city || '',
            avatar_url: profile?.avatar_url || '',
            created_at: l.created_at
          };
        });
        setLikers(likersWithProfiles);
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

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дней назад`;
    if (days < 30) return `${Math.floor(days / 7)} недель назад`;
    return date.toLocaleDateString('ru-RU');
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen pt-20 pb-6 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-6 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-red-400" />
            Кто поставил лайк
          </h1>
          <p className="text-muted-foreground">Люди, которые поставили вам лайк</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : likers.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Heart className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Нет лайков</h3>
            <p className="text-muted-foreground">
              Когда кто-то поставит вам лайк, он появится здесь.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {likers.map((liker) => (
              <Link key={`${liker.id}-${liker.created_at}`} href={`/profile/${liker.id}`}>
                <GlassCard className="p-4 hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    {liker.avatar_url ? (
                      <img
                        src={liker.avatar_url}
                        alt={liker.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{liker.name}, {liker.age}</h3>
                      <p className="text-sm text-muted-foreground">{liker.city}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(liker.created_at)}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/profile" className="text-primary hover:underline">
            Вернуться в профиль →
          </Link>
        </div>
      </div>
    </div>
  );
}
