"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Video, Filter, Star, Loader2, Heart, X, Eye } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

const MOCK_MATCHES = [];

export default function DashboardPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);

  const trackStats = (targetUserId: string, action: 'view' | 'like' | 'favorite' | 'match') => {
    const statsKey = `profile_stats_${targetUserId}`;
    const stored = localStorage.getItem(statsKey);
    const stats = stored ? JSON.parse(stored) : { views: 0, likes: 0, favorites: 0, matches: 0 };
    
    if (action === 'view') stats.views++;
    if (action === 'like') stats.likes++;
    if (action === 'favorite') stats.favorites++;
    if (action === 'match') stats.matches++;
    
    localStorage.setItem(statsKey, JSON.stringify(stats));
  };

  const handleLike = async (match: typeof MOCK_MATCHES[0]) => {
    if (!user) return;
    
    if (likes.includes(match.id)) {
      setLikes(prev => prev.filter(id => id !== match.id));
    } else {
      setLikes(prev => [...prev, match.id]);
      trackStats(match.id, 'like');
      
      if (Math.random() > 0.5) {
        setMatches(prev => [...prev, match.id]);
        trackStats(match.id, 'match');
        alert(`🎉 Это взаимный лайк! Вы можете назначить свидание с ${match.name}!`);
      } else {
        alert(`Лайк отправлен ${match.name}!`);
      }
    }
  };

  const canInteract = (matchId: string) => matches.includes(matchId);

  const handleViewProfile = (match: typeof MOCK_MATCHES[0]) => {
    trackStats(match.id, 'view');
    router.push(`/profile/${match.id}`);
  };

  const handleRemove = (match: typeof MOCK_MATCHES[0]) => {
    alert(`Вы убрали ${match.name} из списка. Чтобы увидеть его снова, нужно будет искать заново.`);
  };

  const handleMessage = (match: typeof MOCK_MATCHES[0]) => {
    if (!canInteract(match.id)) {
      alert(`💌 Чтобы написать ${match.name}, сначала нужно взаимно лайкнуть друг друга!\n\nПоставьте лайк и ждите взаимности.`);
      return;
    }
    router.push("/messages");
  };

  const handleDate = (match: typeof MOCK_MATCHES[0]) => {
    if (!canInteract(match.id)) {
      alert(`🎥 Чтобы пригласить ${match.name} на свидание, нужно чтобы это был взаимный лайк!\n\nКак это работает:\n1. Поставьте лайк понравившемуся пользователю\n2. Если этот пользователь тоже поставит вам лайк - это взаимность!\n3. После взаимного лайка вы можете написать или пригласить на свидание\n\nВзаимные лайки = ваша пара!`);
      return;
    }
    router.push("/date");
  };

  const handleFavorite = async (match: typeof MOCK_MATCHES[0]) => {
    if (!user) return;
    
    const isFavorited = favorites.includes(match.id);
    
    if (isFavorited) {
      setFavorites(prev => prev.filter(id => id !== match.id));
    } else {
      setFavorites(prev => [...prev, match.id]);
      trackStats(match.id, 'favorite');
      
      await createNotification({
        userId: user.id,
        type: 'favorite',
        title: 'Добавлено в избранное',
        message: `Вы добавили ${match.name} в избранное`,
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      
      
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Ваши резонансы</h1>
            <p className="text-muted-foreground">Профили с высокой совместимостью, соответствующие вашему нейровектору.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/assessment">
              <Button variant="outline" className="glass rounded-full">
                <Sparkles className="w-4 h-4 mr-2" /> AI Анализ
              </Button>
            </Link>
            <Button variant="outline" className="glass rounded-full">
              <Filter className="w-4 h-4 mr-2" /> Настроить векторы
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_MATCHES.map((match) => (
            <GlassCard key={match.id} className="group relative">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src={match.avatar} 
                  alt={match.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-4 right-4 glass p-2 rounded-xl flex items-center gap-1 border-primary/40">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold font-headline">{match.score}%</span>
                </div>

                <div className="absolute top-4 left-4 flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/50 hover:text-white"
                    onClick={() => handleRemove(match)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-blue-500/50 hover:text-white"
                    onClick={() => handleViewProfile(match)}
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>

                <div className="absolute bottom-24 left-4 right-4 flex justify-center gap-4">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={`rounded-full bg-black/30 backdrop-blur-sm hover:bg-pink-500/50 ${likes.includes(match.id) ? 'text-pink-500' : 'hover:text-white'}`}
                    onClick={() => handleLike(match)}
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={`rounded-full bg-black/30 backdrop-blur-sm hover:bg-yellow-500/50 ${favorites.includes(match.id) ? 'text-yellow-400' : 'hover:text-white'}`}
                    onClick={() => handleFavorite(match)}
                  >
                    <Star className={`w-6 h-6 ${favorites.includes(match.id) ? 'fill-yellow-400' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold font-headline">{match.name}, {match.age}</h3>
                  <div className="flex gap-2">
                    {matches.includes(match.id) && (
                      <Badge variant="secondary" className="glass bg-green-500/20 text-green-400 border-green-500/30">
                        Взаимно
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.traits.map(trait => (
                    <Badge key={trait} variant="secondary" className="glass bg-white/10 rounded-md border-white/5">
                      {trait}
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{match.bio}</p>

                <div className="pt-4 grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className={`w-full rounded-full glass border-primary/20 hover:bg-primary/10 ${!canInteract(match.id) ? 'opacity-50' : ''}`}
                    onClick={() => handleMessage(match)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Написать
                  </Button>
                  <Button 
                    className={`w-full rounded-full ${canInteract(match.id) ? 'neo-glow' : 'opacity-50'}`}
                    onClick={() => handleDate(match)}
                  >
                    <Video className="w-4 h-4 mr-2" /> Свидание
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}

          <div className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center space-y-4 hover:border-primary/40 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-headline">Новые векторы</h3>
            <p className="text-sm text-muted-foreground">Облако анализирует новые совместимые сущности. Загляните позже.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
