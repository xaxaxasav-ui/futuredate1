"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Star, MessageSquare, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { createNotification } from "@/lib/notifications";
import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  birth_date: string | null;
  gender: string | null;
  city: string | null;
  traits: string[] | null;
  hobbies: string[] | null;
  talents: string[] | null;
  photos: string[] | null;
}

export default function ViewProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabase();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!params.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [params.id]);

  const handleLike = async () => {
    if (!user || !profile) return;
    
    const { error } = await supabase.from('likes').insert({
      user_id: user.id,
      liked_user_id: profile.id,
    });

    if (!error) {
      await createNotification({
        userId: profile.id,
        type: 'like',
        title: 'Новый лайк!',
        message: `${user.user_metadata?.full_name || 'Кто-то'} поставил вам лайк`,
        fromUserId: user.id,
        fromUserName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь',
        link: '/dashboard',
      });
    }
  };

  const handleFavorite = async () => {
    if (!user || !profile) return;
    
    const { error } = await supabase.from('favorites').insert({
      user_id: user.id,
      favorited_user_id: profile.id,
    });

    if (!error) {
      await createNotification({
        userId: profile.id,
        type: 'favorite',
        title: 'Добавлены в избранное!',
        message: `${user.user_metadata?.full_name || 'Кто-то'} добавил вас в избранное`,
        fromUserId: user.id,
        fromUserName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь',
        link: '/favorites',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 px-6 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Профиль не найден</p>
        <Link href="/dashboard">
          <Button>Вернуться к поиску</Button>
        </Link>
      </div>
    );
  }

  const age = profile.birth_date 
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() 
    : null;

  return (
    <div className="min-h-screen pt-20 pb-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30" />
          <GlassCard className="p-1 rotate-1">
            <div className="rounded-xl overflow-hidden">
              <img 
                src={profile.avatar_url || PlaceHolderImages[0].imageUrl}
                alt={profile.full_name || 'Фото'}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
          </GlassCard>
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <button 
              onClick={handleLike}
              className="p-4 rounded-full bg-black/30 backdrop-blur-sm hover:bg-pink-500/50 text-white"
            >
              <Heart className="w-6 h-6" />
            </button>
            <button 
              onClick={handleFavorite}
              className="p-4 rounded-full bg-black/30 backdrop-blur-sm hover:bg-yellow-500/50 text-white"
            >
              <Star className="w-6 h-6" />
            </button>
            <button 
              onClick={() => router.push(`/messages?chat=${profile.id}`)}
              className="p-4 rounded-full bg-black/30 backdrop-blur-sm hover:bg-green-500/50 text-white"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        </div>

        <GlassCard className="p-6">
          <h1 className="text-2xl font-bold">
            {profile.full_name || 'Неизвестно'}{age ? `, ${age}` : ''}
          </h1>
          
          {profile.city && (
            <p className="text-muted-foreground mt-1">{profile.city}</p>
          )}

          {profile.bio && (
            <p className="mt-4">{profile.bio}</p>
          )}
        </GlassCard>

        {profile.traits && profile.traits.length > 0 && (
          <GlassCard className="p-6">
            <h3 className="font-bold mb-3">Особенности</h3>
            <div className="flex flex-wrap gap-2">
              {profile.traits.map((trait) => (
                <Badge key={trait} variant="secondary" className="glass">
                  {trait}
                </Badge>
              ))}
            </div>
          </GlassCard>
        )}

        {profile.hobbies && profile.hobbies.length > 0 && (
          <GlassCard className="p-6">
            <h3 className="font-bold mb-3">Интересы</h3>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby) => (
                <Badge key={hobby} variant="outline" className="border-primary/30 text-primary">
                  {hobby}
                </Badge>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}