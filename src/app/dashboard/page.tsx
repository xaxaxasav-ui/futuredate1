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
import { getAllProfiles, Profile, supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

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

  const handleLike = async (profile: Profile) => {
    if (!user) return;
    
    if (likes.includes(profile.id)) {
      setLikes(prev => prev.filter(id => id !== profile.id));
    } else {
      setLikes(prev => [...prev, profile.id]);
      
      // Лайк сохраняем (409 = уже есть, игнорируем)
      try {
        await supabase.from('likes').upsert({
          user_id: user.id,
          liked_user_id: profile.id,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,liked_user_id' });
      } catch (e) {}
      
      // Проверяем взаимный лайк
      try {
        const { data: mutualLike } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', profile.id)
          .eq('liked_user_id', user.id)
          .single();
        
        if (mutualLike) {
          if (!matches.includes(profile.id)) {
            setMatches(prev => [...prev, profile.id]);
          }
          // Создаём match
          try {
            await supabase.from('matches').upsert({
              user_id: user.id,
              matched_user_id: profile.id,
              status: 'accepted',
              created_at: new Date().toISOString(),
            }, { onConflict: 'user_id,matched_user_id' });
          } catch (e) {}
          
          alert(`🎉 Это взаимный лайк! Вы можете написать ${profile.full_name}!`);
        } else {
          alert(`Лайк отправлен ${profile.full_name}!`);
        }
      } catch (e) {
        alert(`Лайк отправлен ${profile.full_name}!`);
      }
    }
  };

  const canInteract = (profileId: string) => matches.includes(profileId);

  const handleViewProfile = (profile: Profile) => {
    trackStats(profile.id, 'view');
    router.push(`/profile/${profile.id}`);
  };

  const handleRemove = (profile: Profile) => {
    alert(`Вы убрали ${profile.full_name} из списка. Чтобы увидеть его снова, нужно будет искать заново.`);
  };

  const handleMessage = (profile: Profile) => {
    if (!canInteract(profile.id)) {
      alert(`💌 Чтобы написать ${profile.full_name}, сначала нужно взаимно лайкнуть друг друга!\n\nПоставьте лайк и ждите взаимности.`);
      return;
    }
    router.push(`/messages?chat=${profile.id}`);
  };

  const handleDate = (profile: Profile) => {
    if (!canInteract(profile.id)) {
      alert(`🎥 Чтобы пригласить ${profile.full_name} на свидание, нужно чтобы это был взаимный лайк!\n\nКак это работает:\n1. Поставьте лайк понравившемуся пользователю\n2. Если этот пользователь тоже поставит вам лайк - это взаимность!\n3. После взаимного лайка вы можете написать или пригласить на свидание\n\nВзаимные лайки = ваша пара!`);
      return;
    }
    router.push(`/date?user=${profile.id}`);
  };

  const handleFavorite = async (profile: Profile) => {
    if (!user) return;
    
    const isFavorited = favorites.includes(profile.id);
    
    if (isFavorited) {
      setFavorites(prev => prev.filter(id => id !== profile.id));
    } else {
      setFavorites(prev => [...prev, profile.id]);
      
      try {
        await supabase.from('favorites').upsert({
          user_id: user.id,
          favorited_user_id: profile.id,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id,favorited_user_id' });
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('liked_user_id')
          .eq('user_id', user.id);
        
        if (userLikes && userLikes.length > 0) {
          setLikes(userLikes.map(l => l.liked_user_id));
        }
      } catch (e) {
        console.log('Likes table not available');
      }
      
      try {
        const { data: userFavorites } = await supabase
          .from('favorites')
          .select('favorited_user_id')
          .eq('user_id', user.id);
        
        if (userFavorites && userFavorites.length > 0) {
          setFavorites(userFavorites.map(f => f.favorited_user_id));
        }
      } catch (e) {
        console.log('Favorites table not available');
      }
      
      try {
        const { data: userMatches } = await supabase
          .from('matches')
          .select('matched_user_id, user_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
        
        if (userMatches && userMatches.length > 0) {
          const matchIds = userMatches.map(m => 
            m.user_id === user.id ? m.matched_user_id : m.user_id
          );
          setMatches(matchIds);
        }
      } catch (e) {
        console.log('Matches table not available');
      }
    };
    
    loadUserData();
  }, [user]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!user) return;
      try {
        const allProfiles = await getAllProfiles(user.id);
        setProfiles(allProfiles.slice(0, 20));
      } catch (error) {
        console.error("Error loading profiles:", error);
      } finally {
        setLoadingProfiles(false);
      }
    };
    loadProfiles();
  }, [user]);

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
<Link href="/vectors">
              <Button variant="outline" className="glass rounded-full">
                <Filter className="w-4 h-4 mr-2" /> Настроить векторы
              </Button>
            </Link>
          </div>
        </header>

        {loadingProfiles ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-muted-foreground">Пока нет анкет. Завершите тест личности, чтобы найти совместимых партнёров.</p>
              <Link href="/assessment">
                <Button className="mt-4 rounded-full neo-glow">Пройти ИИ тест</Button>
              </Link>
            </div>
          ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profiles.map((profile) => (
            <GlassCard key={profile.id} className="group relative">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src={profile.avatar_url || PlaceHolderImages[0].imageUrl} 
                  alt={profile.full_name || 'User'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-4 right-4 glass p-2 rounded-xl flex items-center gap-1 border-primary/40">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold font-headline">{Math.floor(Math.random() * 20 + 80)}%</span>
                </div>

                <div className="absolute top-4 left-4 flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/50 hover:text-white"
                    onClick={() => handleRemove(profile)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-blue-500/50 hover:text-white"
                    onClick={() => handleViewProfile(profile)}
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>

                <div className="absolute bottom-24 left-4 right-4 flex justify-center gap-4">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={`rounded-full bg-black/30 backdrop-blur-sm hover:bg-pink-500/50 ${likes.includes(profile.id) ? 'text-pink-500' : 'hover:text-white'}`}
                    onClick={() => handleLike(profile)}
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={`rounded-full bg-black/30 backdrop-blur-sm hover:bg-yellow-500/50 ${favorites.includes(profile.id) ? 'text-yellow-400' : 'hover:text-white'}`}
                    onClick={() => handleFavorite(profile)}
                  >
                    <Star className={`w-6 h-6 ${favorites.includes(profile.id) ? 'fill-yellow-400' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold font-headline">{profile.full_name || 'Неизвестно'}, {profile.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : '?'}</h3>
                  <div className="flex gap-2">
                    {matches.includes(profile.id) && (
                      <Badge variant="secondary" className="glass bg-green-500/20 text-green-400 border-green-500/30">
                        Взаимно
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(profile.traits || []).slice(0, 4).map((trait: string) => (
                    <Badge key={trait} variant="secondary" className="glass bg-white/10 rounded-md border-white/5">
                      {trait}
                    </Badge>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio ? profile.bio.replace(/🎯?ИИ_АНАЛИЗ_START.+?ИИ_АНАЛИЗ_END/g, '').trim() || 'Нет описания' : 'Нет описания'}</p>

                <div className="pt-4 grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className={`w-full rounded-full glass border-primary/20 hover:bg-primary/10 ${!canInteract(profile.id) ? 'opacity-50' : ''}`}
                    onClick={() => handleMessage(profile)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Написать
                  </Button>
                  <Button 
                    className={`w-full rounded-full ${canInteract(profile.id) ? 'neo-glow' : 'opacity-50'}`}
                    onClick={() => handleDate(profile)}
                  >
                    <Video className="w-4 h-4 mr-2" /> Свидание
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
          </section>
          )}
      </div>
    </div>
  );
}
