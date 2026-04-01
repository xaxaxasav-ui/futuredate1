"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Heart, Star, MessageSquare, ArrowLeft, MapPin, Calendar, Ruler, GraduationCap, Briefcase, Mail, Phone, X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
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
  looking_for: string | null;
  photos: string[] | null;
  photos_visibility: string | null;
  height: number | null;
  education: string | null;
  occupation: string | null;
}

interface AssessmentResult {
  completedAt: string;
  personalityType: string;
  strengths?: string[];
  idealPartner?: string;
  datingStyle?: string;
}

export default function ViewProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabase();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatch, setIsMatch] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasFavorited, setHasFavorited] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!params.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error && data) {
        const cleanBio = data.bio ? data.bio.replace(/🎯?ИИ_АНАЛИЗ_START.+?ИИ_АНАЛИЗ_END/g, '').trim() : null;
        setProfile({ ...data, bio: cleanBio });
        
        if (data.bio && data.bio.includes('ИИ_АНАЛИЗ_START')) {
          try {
            const match = data.bio.match(/ИИ_АНАЛИЗ_START(\{.*?\})ИИ_АНАЛИЗ_END/);
            if (match) {
              setAssessment(JSON.parse(match[1]));
            }
          } catch (e) {
            console.error('Error parsing assessment:', e);
          }
        }
        
        if (user && user.id !== params.id) {
          await supabase.from('profile_views').insert({
            profile_id: params.id,
            viewer_id: user.id,
          });
          
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('liked_user_id', params.id)
            .single();
          setHasLiked(!!likeData);
          
          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('favorited_user_id', params.id)
            .single();
          setHasFavorited(!!favData);
          
          const { data: matchData } = await supabase
            .from('matches')
            .select('id')
            .eq('status', 'accepted')
            .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
            .or(`user_id.eq.${params.id},matched_user_id.eq.${params.id}`)
            .single();
          setIsMatch(!!matchData);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [params.id, user]);

  const handleLike = async () => {
    if (!user || !profile) return;
    
    try {
      await supabase.from('likes').upsert({
        user_id: user.id,
        liked_user_id: profile.id,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,liked_user_id' });
      setHasLiked(true);
      
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', profile.id)
        .eq('liked_user_id', user.id)
        .single();
      
      if (mutualLike) {
        setIsMatch(true);
        await supabase.from('matches').upsert({
          user_id: user.id,
          matched_user_id: profile.id,
          status: 'accepted',
        }, { onConflict: 'user_id,matched_user_id' });
        alert(`🎉 Это взаимный лайк! Вы можете написать ${profile.full_name}!`);
      } else {
        alert(`Лайк отправлен ${profile.full_name}!`);
      }
    } catch (e) {}
  };

  const handleFavorite = async () => {
    if (!user || !profile) return;
    
    try {
      await supabase.from('favorites').upsert({
        user_id: user.id,
        favorited_user_id: profile.id,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,favorited_user_id' });
      setHasFavorited(true);
    } catch (e) {}
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

  const canViewPhotos = profile.photos_visibility === 'all' || isMatch || profile.photos_visibility === 'none';

  return (
    <div className="min-h-screen pt-20 pb-6 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="main">Обо мне</TabsTrigger>
            <TabsTrigger value="photos">Фото</TabsTrigger>
            <TabsTrigger value="info">Детали</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-4 mt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30" />
              <GlassCard className="p-1">
                <div className="rounded-xl overflow-hidden">
                  <img 
                    src={profile.avatar_url || PlaceHolderImages[0].imageUrl}
                    alt={profile.full_name || 'Фото'}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
              </GlassCard>
              
              {isMatch && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-green-500/80 text-white text-sm font-bold">
                  Взаимно ✓
                </div>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                <button 
                  onClick={handleLike}
                  className={`p-3 rounded-full backdrop-blur-sm text-white transition-colors ${
                    hasLiked 
                      ? 'bg-pink-500' 
                      : 'bg-black/30 hover:bg-pink-500/50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${hasLiked ? 'fill-white' : ''}`} />
                </button>
                <button 
                  onClick={handleFavorite}
                  className={`p-3 rounded-full backdrop-blur-sm text-white transition-colors ${
                    hasFavorited 
                      ? 'bg-yellow-500' 
                      : 'bg-black/30 hover:bg-yellow-500/50'
                  }`}
                >
                  <Star className={`w-5 h-5 ${hasFavorited ? 'fill-white' : ''}`} />
                </button>
                {isMatch && (
                  <button 
                    onClick={() => router.push(`/messages?chat=${profile.id}`)}
                    className="p-3 rounded-full bg-green-500/80 hover:bg-green-500 text-white"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <GlassCard className="p-5">
              <h1 className="text-2xl font-bold">
                {profile.full_name || 'Неизвестно'}{age ? `, ${age}` : ''}
                {profile.gender && ` (${profile.gender === 'male' ? 'М' : 'Ж'})`}
              </h1>
              
              {profile.city && (
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4" />
                  {profile.city}
                </div>
              )}

              {profile.bio && (
                <p className="mt-4 text-sm">{profile.bio}</p>
              )}

              {profile.looking_for && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-muted-foreground mb-2">Ищу:</p>
                  <p className="font-medium">{profile.looking_for}</p>
                </div>
              )}
            </GlassCard>

            {profile.traits && profile.traits.length > 0 && (
              <GlassCard className="p-5">
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
              <GlassCard className="p-5">
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
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <GlassCard className="p-5">
              {canViewPhotos && profile.photos && profile.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {profile.photos.map((photo, i) => (
                    <div 
                      key={i} 
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img 
                        src={photo} 
                        alt={`Фото ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Фото недоступны</p>
                  {profile.photos_visibility === 'matches' && !isMatch && (
                    <p className="text-sm mt-2">Фото видны только взаимным лайкам</p>
                  )}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <GlassCard className="p-5 space-y-4">
              {profile.height && (
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Рост</p>
                    <p className="font-medium">{profile.height} см</p>
                  </div>
                </div>
              )}
              
              {profile.education && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Образование</p>
                    <p className="font-medium">{profile.education}</p>
                  </div>
                </div>
              )}
              
              {profile.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Работа</p>
                    <p className="font-medium">{profile.occupation}</p>
                  </div>
                </div>
              )}
              
              {profile.talents && profile.talents.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-muted-foreground mb-2">Таланты</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.talents.map((talent) => (
                      <Badge key={talent} variant="outline" className="border-primary/30 text-primary">
                        ⭐ {talent}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>

        {assessment && (
          <GlassCard className="p-5 border-primary/30">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold">ИИ Анализ личности</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Тип личности</span>
                <Badge className="bg-primary/20 text-primary">{assessment.personalityType}</Badge>
              </div>
              
              {assessment.strengths && assessment.strengths.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Сильные стороны</p>
                  <div className="flex flex-wrap gap-1">
                    {assessment.strengths.slice(0, 5).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {assessment.idealPartner && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Идеальный партнёр</p>
                  <p className="text-sm">{assessment.idealPartner}</p>
                </div>
              )}
              
              {assessment.datingStyle && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Стиль свиданий</p>
                  <p className="text-sm">{assessment.datingStyle}</p>
                </div>
              )}
              
              {assessment.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Тест пройден: {new Date(assessment.completedAt).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedPhoto && (
              <img 
                src={selectedPhoto} 
                alt="Фото"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}