"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Eye, Loader2, User } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Viewer {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar_url: string;
  created_at: string;
}

export default function ProfileViewsPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchViewers();
    }
  }, [user]);

  async function fetchViewers() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profile_views')
      .select('viewer_id, created_at')
      .eq('viewed_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching viewers:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const viewerIds = [...new Set(data.map((v: any) => v.viewer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, birth_date')
        .in('id', viewerIds);

      if (profiles && profiles.length > 0) {
        const viewersWithProfiles = data.map((v: any) => {
          const profile = profiles.find((p: any) => p.id === v.viewer_id);
          const age = profile?.birth_date ? calculateAge(profile.birth_date) : 0;
          return {
            id: v.viewer_id,
            name: profile?.full_name || 'Неизвестный',
            age,
            city: profile?.city || '',
            avatar_url: profile?.avatar_url || '',
            created_at: v.created_at
          };
        });
        setViewers(viewersWithProfiles);
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
            <Eye className="w-8 h-8 text-blue-400" />
            Кто смотрел профиль
          </h1>
          <p className="text-muted-foreground">Люди, которые недавно просматривали ваш профиль</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : viewers.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Eye className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Никто ещё не смотрел</h3>
            <p className="text-muted-foreground">
              Когда кто-то посмотрит ваш профиль, он появится здесь.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {viewers.map((viewer) => (
              <Link key={`${viewer.id}-${viewer.created_at}`} href={`/user/${viewer.id}`}>
                <GlassCard className="p-4 hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center gap-4">
                    {viewer.avatar_url ? (
                      <img
                        src={viewer.avatar_url}
                        alt={viewer.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{viewer.name}, {viewer.age}</h3>
                      <p className="text-sm text-muted-foreground">{viewer.city}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(viewer.created_at)}
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
