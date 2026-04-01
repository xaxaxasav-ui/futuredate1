"use client";

import { useState, useEffect, useRef } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Mail, Phone, Calendar, Edit, Save, Settings, Shield, Trash2, Heart, Sparkles, Music, Book, Camera, Gamepad, Code, TreePine, Utensils, Dumbbell, Globe, MapPin, Upload, X, Image as ImageIcon, Ruler, Briefcase, GraduationCap, Baby, Wine, Cigarette, CheckCircle, AlertCircle, TrendingUp, Eye, MessageCircle, Star, Clock, Zap, Award, Target, Activity, BrainCircuit, Share2, Copy, Check } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useGeolocation } from "@/components/Geolocation";

const HOBBY_OPTIONS = [
  { id: "music", label: "Музыка", icon: Music },
  { id: "reading", label: "Чтение", icon: Book },
  { id: "photography", label: "Фотография", icon: Camera },
  { id: "gaming", label: "Игры", icon: Gamepad },
  { id: "coding", label: "Программирование", icon: Code },
  { id: "nature", label: "Природа", icon: TreePine },
  { id: "cooking", label: "Кулинария", icon: Utensils },
  { id: "fitness", label: "Спорт", icon: Dumbbell },
  { id: "travel", label: "Путешествия", icon: Globe },
];

const TALENT_OPTIONS = [
  "Творческий", "Аналитический", "Коммуникабельный", "Лидер", "Эмпат", 
  "Организованный", "Гибкий", "Спортсмен", "Музыкант", "Художник",
  "Писатель", "Танцор", "Кулинар", "Путешественник", "Экстремал"
];

const LOOKING_FOR_OPTIONS = [
  "Серьёзные отношения", "Дружба", "Новые знакомства", "Приключения", 
  "Единомышленник", "Партнёр для хобби", "Отношения на расстоянии"
];

const GENDER_OPTIONS = [
  { value: "male", label: "Мужчина" },
  { value: "female", label: "Женщина" },
  { value: "other", label: "Другое" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "single", label: "Свободен/свободна" },
  { value: "relationship", label: "В отношениях" },
  { value: "divorced", label: "Разведён/разведена" },
  { value: "widowed", label: "Вдовец/вдова" },
];

const CHILDREN_OPTIONS = [
  { value: "no", label: "Нет" },
  { value: "yes_live", label: "Да, живут со мной" },
  { value: "yes_away", label: "Да, живут отдельно" },
  { value: "not_sure", label: "Затрудняюсь ответить" },
];

const SMOKING_OPTIONS = [
  { value: "no", label: "Не курю" },
  { value: "sometimes", label: "Иногда" },
  { value: "yes", label: "Курю" },
  { value: "trying", label: "Бросаю" },
];

const ALCOHOL_OPTIONS = [
  { value: "no", label: "Не пью" },
  { value: "sometimes", label: "Иногда" },
  { value: "yes", label: "Пью" },
  { value: "sober", label: "Трезвый образ жизни" },
];

const LANGUAGE_OPTIONS = [
  "Русский", "Английский", "Испанский", "Немецкий", "Французский", 
  "Итальянский", "Китайский", "Японский", "Корейский", "Арабский", "Португальский"
];

const EDUCATION_OPTIONS = [
  "Среднее", "Среднее специальное", "Незаконченное высшее", "Высшее образование", "Бакалавр", "Магистр", "Аспирант", "Доктор наук"
];

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

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useSupabase();
  const router = useRouter();
  const { latitude, longitude, city, loading: geoLoading, error: geoError, refresh: refreshGeo } = useGeolocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const getReferralCode = () => {
    if (profile?.username) return profile.username;
    if (user?.id) return user.id.slice(0, 8);
    return 'user';
  };

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/invite/${getReferralCode()}`
    : '';

  const shareProfile = async () => {
    const shareData = {
      title: 'Свидание будущего AI',
      text: 'Присоединяйся к знакомствам нового поколения!',
      url: referralLink
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };
  const [editData, setEditData] = useState({
    full_name: "",
    bio: "",
    username: "",
    hobbies: [] as string[],
    talents: [] as string[],
    looking_for: "",
    looking_for_gender: "",
    looking_for_age_min: 18,
    looking_for_age_max: 50,
    looking_for_height_min: 150,
    looking_for_height_max: 200,
    birth_date: "",
    gender: "",
    height: 170,
    education: "",
    occupation: "",
    languages: [] as string[],
    relationship_status: "",
    children: "",
    smoking: "",
    alcohol: "",
    photos: [] as string[],
    photos_visibility: "all",
    photos_blocked_users: [] as string[],
    profile_visibility: "all",
    profile_blocked_users: [] as string[],
  });

useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user, profile, router, refreshProfile]);

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  
  useEffect(() => {
    if (profile && !initialLoadDone) {
      setEditData({
        full_name: profile.full_name || "",
        bio: profile.bio ? profile.bio.replace(/🎯?ИИ_АНАЛИЗ_START.+?ИИ_АНАЛИЗ_END/g, '').trim() : "",
        username: profile.username || "",
        hobbies: profile.hobbies || [],
        talents: profile.talents || [],
        looking_for: profile.looking_for || "",
        looking_for_gender: profile.looking_for_gender || "",
        looking_for_age_min: profile.looking_for_age_min || 18,
        looking_for_age_max: profile.looking_for_age_max || 50,
        looking_for_height_min: profile.looking_for_height_min || 150,
        looking_for_height_max: profile.looking_for_height_max || 200,
        birth_date: profile.birth_date || "",
        gender: profile.gender || "",
        height: profile.height || 170,
        education: profile.education || "",
        occupation: profile.occupation || "",
        languages: profile.languages || [],
        relationship_status: profile.relationship_status || "",
        children: profile.children || "",
        smoking: profile.smoking || "",
        alcohol: profile.alcohol || "",
        photos: profile.photos || [],
        photos_visibility: profile.photos_visibility || "all",
        photos_blocked_users: profile.photos_blocked_users || [],
        profile_visibility: profile.profile_visibility || "all",
        profile_blocked_users: profile.profile_blocked_users || [],
      });
      setInputName(profile.full_name || "");
      setInputUsername(profile.username || "");
      setInitialLoadDone(true);
    }
  }, [profile, initialLoadDone]);

  useEffect(() => {
    const saveGeolocation = async () => {
      if (!user || !latitude || !longitude || profile?.latitude) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          city: city || null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving geolocation:', error.message, error.details);
      } else {
        refreshProfile();
      }
    };

    if (!geoLoading && latitude && longitude && user) {
      saveGeolocation();
    }
  }, [latitude, longitude, city, geoLoading, user, profile, refreshProfile]);

  const handleSave = async () => {
    if (!user) {
      alert("Вы не авторизованы");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Saving profile for user:", user.id);
      console.log("Profile data:", editData);
      
      const profileData = {
        full_name: editData.full_name,
        bio: editData.bio ? editData.bio.replace(/🎯?ИИ_АНАЛИЗ_START.+?ИИ_АНАЛИЗ_END/g, '').trim() : '',
        username: editData.username || `user_${user.id.slice(0,8)}`,
        hobbies: editData.hobbies,
        talents: editData.talents,
        looking_for: editData.looking_for,
        looking_for_gender: editData.looking_for_gender || null,
        looking_for_age_min: editData.looking_for_age_min,
        looking_for_age_max: editData.looking_for_age_max,
        looking_for_height_min: editData.looking_for_height_min,
        looking_for_height_max: editData.looking_for_height_max,
        birth_date: editData.birth_date || null,
        gender: editData.gender || null,
        height: editData.height,
        education: editData.education || null,
        occupation: editData.occupation || null,
        languages: editData.languages,
        relationship_status: editData.relationship_status || null,
        children: editData.children || null,
        smoking: editData.smoking || null,
        alcohol: editData.alcohol || null,
        photos: editData.photos,
        photos_visibility: editData.photos_visibility,
        photos_blocked_users: editData.photos_blocked_users,
        profile_visibility: editData.profile_visibility,
        profile_blocked_users: editData.profile_blocked_users,
        updated_at: new Date().toISOString(),
      };

      console.log("Saving profile for user:", user.id, "data:", profileData);

      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      console.log("Existing profile check:", { existingProfile, checkError });

      let result;
      if (existingProfile) {
        console.log("Updating existing profile");
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select();
      } else {
        console.log("Creating new profile with data:", profileData);
        const insertData = {
          id: user.id,
          ...profileData
        };
        result = await supabase
          .from('profiles')
          .upsert(insertData)
          .select();
      }

      const { data, error } = result;

      console.log("Supabase response:", { data, error });
      console.log("Full error:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
      console.log("Error hint:", error?.hint);

      if (error) {
        alert("Ошибка сохранения: " + error.message + "\nКод: " + error.code + "\nДетали: " + (error.details || error.hint || ""));
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error("No data returned from save");
        alert("Не удалось сохранить профиль. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }
      
      console.log("Profile saved successfully:", data[0]);
      
      await refreshProfile();
      setEditing(false);
      alert("Профиль успешно сохранен!");
    } catch (error: any) {
      console.error("Save error:", error);
      alert("Ошибка: " + (error?.message || "Неизвестная ошибка"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!user || !confirm("Вы уверены, что хотите удалить аккаунт? Это действие необратимо.")) return;
    
    setLoading(true);
    try {
      await supabase.auth.admin.deleteUser(user.id);
      await signOut();
      router.push("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHobby = (hobbyId: string) => {
    setEditData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobbyId)
        ? prev.hobbies.filter(h => h !== hobbyId)
        : [...prev.hobbies, hobbyId]
    }));
  };

  const toggleTalent = (talent: string) => {
    setEditData(prev => ({
      ...prev,
      talents: prev.talents.includes(talent)
        ? prev.talents.filter(t => t !== talent)
        : [...prev.talents, talent]
    }));
  };

  const toggleLanguage = (lang: string) => {
    setEditData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingPhoto(true);
    try {
      const newPhotos: string[] = [...(editData.photos || [])];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        try {
          const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.log('Storage upload failed, using local preview:', uploadError.message);
          }
          
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            newPhotos.push(urlData.publicUrl);
          } else {
            const localUrl = URL.createObjectURL(file);
            newPhotos.push(localUrl);
          }
        } catch (uploadErr) {
          console.log('Upload exception, using local:', uploadErr);
          const localUrl = URL.createObjectURL(file);
          newPhotos.push(localUrl);
        }
      }

      setEditData(prev => ({ ...prev, photos: newPhotos }));
      
      await supabase
        .from('profiles')
        .update({ photos: newPhotos })
        .eq('id', user.id);
      
      await refreshProfile();
    } catch (error: any) {
      console.error('Error:', error);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setAvatarFromPhoto = async (photoUrl: string, index: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: photoUrl })
      .eq('id', user.id);
    
    if (error) {
      console.error('Avatar update error:', error);
    } else {
      await refreshProfile();
    }
  };

  const handleDeletePhoto = async (index: number) => {
    if (!user) return;
    
    const newPhotos = editData.photos.filter((_, i) => i !== index);
    setEditData(prev => ({ ...prev, photos: newPhotos }));
    
    // Если удалили фото которое было аватаркой - обновляем
    const wasAvatar = editData.photos[index] === profile?.avatar_url;
    
    await supabase
      .from('profiles')
      .update({ 
        photos: newPhotos,
        avatar_url: wasAvatar && newPhotos[0] ? newPhotos[0] : profile?.avatar_url
      })
      .eq('id', user.id);
    
    await refreshProfile();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url 
    ? profile.avatar_url.startsWith('blob:') 
      ? PlaceHolderImages[1].imageUrl 
      : profile.avatar_url 
    : PlaceHolderImages[1].imageUrl;
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : 'Неизвестно';
  const age = profile?.birth_date ? calculateAge(profile.birth_date) : null;

  const profileCompletion = () => {
    let score = 0;
    const fields = [
      profile?.avatar_url, profile?.full_name, profile?.bio, profile?.birth_date,
      profile?.gender, profile?.city, profile?.height, profile?.education,
      profile?.occupation, profile?.hobbies?.length, profile?.talents?.length
    ];
    fields.forEach(f => {
      if (f && (typeof f !== 'number' || f > 0)) score += 9;
      else if (typeof f === 'number' && f > 0) score += 9;
    });
    return Math.min(score, 100);
  };
  const completion = profileCompletion();

  const stats = {
    views: Math.floor(Math.random() * 500) + 50,
    likes: Math.floor(Math.random() * 100) + 10,
    messages: Math.floor(Math.random() * 200) + 20,
    matches: Math.floor(Math.random() * 20) + 1,
  };

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      
      
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-headline">Профиль</h1>
            <p className="text-muted-foreground">Управление вашими данными</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="glass rounded-full">
              К поиску
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold">{stats.views}</p>
            <p className="text-xs text-muted-foreground">Просмотров</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Heart className="w-6 h-6 mx-auto mb-2 text-pink-400" />
            <p className="text-2xl font-bold">{stats.likes}</p>
            <p className="text-xs text-muted-foreground">Лайков</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold">{stats.messages}</p>
            <p className="text-xs text-muted-foreground">Сообщений</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold">{stats.matches}</p>
            <p className="text-xs text-muted-foreground">Совпадений</p>
          </GlassCard>
        </div>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Заполненность профиля</span>
            <span className={`text-sm font-bold ${completion >= 70 ? 'text-green-400' : completion >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {completion}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${completion >= 70 ? 'bg-green-400' : completion >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completion < 40 ? 'Заполните больше полей для привлечения внимания!' : completion < 70 ? 'Хорошо, но можно лучше!' : 'Отличный профиль!'}
          </p>
        </GlassCard>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <GlassCard className="p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30">
                    <img 
                      src={avatarUrl} 
                      alt="Аватар" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = PlaceHolderImages[1].imageUrl;
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Verification Section - Link to separate page */}
              <div className="mt-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-3 w-full box-border">
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm">Верификация</span>
                  </div>
                  {profile?.is_verified === true ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" /> Верифицирован
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertCircle className="w-3 h-3 mr-1" /> Не верифицирован
                    </Badge>
                  )}
                </div>
                
                {profile?.is_verified !== true && (
                  <Link href="/verification" className="block w-full box-border">
                    <Button
                      className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
                    >
                      Пройти верификацию
                    </Button>
                  </Link>
                )}
                
                {profile?.is_verified === true && (
                  <p className="text-xs text-green-400">Аккаунт верифицирован</p>
                )}
              </div>

              <div className="text-center">
              {!editing ? (
                <>
                  <h2 className="text-2xl font-bold font-headline">{profile?.full_name || "Пользователь"}</h2>
                  <p className="text-muted-foreground text-sm">@{profile?.username || "username"}</p>
                  {age && (
                    <p className="text-muted-foreground text-sm">{age} лет</p>
                  )}
                </>
              ) : (
                <div className="space-y-2 text-left">
                  <Input
                    placeholder="Ваше имя"
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      setEditData({...editData, full_name: e.target.value});
                    }}
                    className="text-center"
                  />
                  <Input
                    placeholder="Username"
                    value={inputUsername}
                    onChange={(e) => {
                      setInputUsername(e.target.value);
                      setEditData({...editData, username: e.target.value});
                    }}
                    className="text-center"
                  />
                </div>
              )}

              <div className="mt-6 space-y-3 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.city ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}</span>
                  </div>
                ) : city ? (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{city}</span>
                    </div>
                    <button onClick={() => setShowCityDialog(true)} className="text-xs text-primary hover:underline">
                      Изменить
                    </button>
                  </div>
                ) : geoLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Определение местоположения...</span>
                  </div>
                ) : geoError ? (
                  <button onClick={() => setShowCityDialog(true)} className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary">
                    <MapPin className="w-4 h-4" />
                    <span>Выбрать город</span>
                  </button>
                ) : latitude && longitude ? (
                  <button onClick={() => setShowCityDialog(true)} className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary">
                    <MapPin className="w-4 h-4" />
                    <span>Выбрать город</span>
                  </button>
                ) : null}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Участник с {memberSince}</span>
                </div>
              </div>

              {profile && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {profile.gender && (
                    <Badge variant="outline" className="text-xs">
                      {profile.gender === 'male' ? '👨 Мужчина' : profile.gender === 'female' ? '👩 Женщина' : '👤 Другое'}
                    </Badge>
                  )}
                  {profile.height && (
                    <Badge variant="outline" className="text-xs">
                      📏 {profile.height} см
                    </Badge>
                  )}
                  {profile.education && (
                    <Badge variant="outline" className="text-xs">
                      🎓 {profile.education}
                    </Badge>
                  )}
                  {profile.relationship_status && (
                    <Badge variant="outline" className="text-xs">
                      💕 {profile.relationship_status === 'single' ? 'Свободен/а' : profile.relationship_status === 'relationship' ? 'В отношениях' : 'Разведён/а'}
                    </Badge>
                  )}
                  {profile.children && (
                    <Badge variant="outline" className="text-xs">
                      👶 {profile.children === 'no' ? 'Нет детей' : 'Есть дети'}
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Button 
                  onClick={shareProfile}
                  variant="outline"
                  className="w-full rounded-full"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Ссылка скопирована!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Поделиться профилем
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Приглашай друзей и получай бонусы!
                </p>
              </div>

              {profile?.hobbies && profile.hobbies.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Интересы</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.hobbies.slice(0, 5).map((hobby, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-white/10">
                        {hobby}
                      </Badge>
                    ))}
                    {profile.hobbies.length > 5 && (
                      <Badge variant="secondary" className="text-xs bg-white/10">
                        +{profile.hobbies.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {profile?.talents && profile.talents.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.talents.slice(0, 3).map((talent, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">
                        ⭐ {talent}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="w-full rounded-full neo-glow">
                    <Edit className="w-4 h-4 mr-2" /> Редактировать
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} disabled={loading} className="w-full rounded-full neo-glow">
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline" className="w-full rounded-full">
                      Отмена
                    </Button>
                  </>
                )}
              </div>
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="info" className="w-full" style={{ position: 'relative', zIndex: 1 }}>
              <TabsList className="flex w-full overflow-x-auto pb-2 gap-1">
                <TabsTrigger value="info" className="text-xs px-3 py-2 flex-shrink-0">Обо мне</TabsTrigger>
                <TabsTrigger value="interests" className="text-xs px-3 py-2 flex-shrink-0">Интересы</TabsTrigger>
                <TabsTrigger value="details" className="text-xs px-3 py-2 flex-shrink-0">Анкета</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs px-3 py-2 flex-shrink-0">ИИ</TabsTrigger>
                <TabsTrigger value="photos" className="text-xs px-3 py-2 flex-shrink-0">Фото</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-3 py-2 flex-shrink-0">Настройки</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" /> Основная информация
                  </h3>
                  
                  {!editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Имя</Label>
                          <p className="font-medium">{profile?.full_name || "Не указано"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Username</Label>
                          <p className="font-medium">@{profile?.username || "Не указан"}</p>
                        </div>
                      </div>
                      {age && (
                        <div>
                          <Label className="text-muted-foreground">Возраст</Label>
                          <p className="font-medium">{age} лет</p>
                        </div>
                      )}
                      {profile?.birth_date && (
                        <div>
                          <Label className="text-muted-foreground">Дата рождения</Label>
                          <p className="font-medium">{new Date(profile.birth_date).toLocaleDateString('ru-RU')}</p>
                        </div>
                      )}
                      {profile?.gender && (
                        <div>
                          <Label className="text-muted-foreground">Пол</Label>
                          <p className="font-medium">
                            {GENDER_OPTIONS.find(g => g.value === profile.gender)?.label || profile.gender}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground">Биография</Label>
                        <p className="font-medium">
                          {profile?.bio 
                            ? profile.bio.replace(/🎯?ИИ_АНАЛИЗ_START.+?ИИ_АНАЛИЗ_END/g, '').trim() || "Не указано"
                            : "Не указано"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Телефон</Label>
                        <p className="font-medium">{profile?.phone || "Не указан"}</p>
                      </div>
                      {profile?.city ? (
                        <div>
                          <Label className="text-muted-foreground">Местоположение</Label>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {profile.city}
                          </p>
                        </div>
                      ) : city ? (
                        <div>
                          <Label className="text-muted-foreground">Местоположение</Label>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {city} (определено автоматически)
                            <button onClick={() => setShowCityDialog(true)} className="text-xs text-primary hover:underline ml-2">
                              Изменить
                            </button>
                          </p>
                        </div>
                      ) : geoLoading ? (
                        <div>
                          <Label className="text-muted-foreground">Местоположение</Label>
                          <p className="font-medium text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Определение местоположения...
                          </p>
                        </div>
                      ) : geoError ? (
                        <div>
                          <Label className="text-muted-foreground">Местоположение</Label>
                          <button onClick={() => setShowCityDialog(true)} className="font-medium text-sm text-primary hover:underline flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Выбрать город
                          </button>
                        </div>
                      ) : latitude && longitude ? (
                        <div>
                          <Label className="text-muted-foreground">Местоположение</Label>
                          <button onClick={() => setShowCityDialog(true)} className="font-medium text-sm text-primary hover:underline flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Выбрать город
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Дата рождения</Label>
                          <Input
                            type="date"
                            value={editData.birth_date}
                            onChange={(e) => setEditData({...editData, birth_date: e.target.value})}
                            className="glass"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Пол</Label>
                          <select
                            value={editData.gender}
                            onChange={(e) => setEditData({...editData, gender: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {GENDER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Биография</Label>
                        <Textarea
                          placeholder="Расскажите о себе, своих интересах, целях..."
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          className="glass"
                          rows={6}
                        />
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="interests" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Интересы и увлечения
                  </h3>
                  
                  {!editing ? (
                    <div className="space-y-4">
                      {profile?.hobbies && profile.hobbies.length > 0 ? (
                        <div>
                          <Label className="text-muted-foreground mb-2 block">Хобби</Label>
                          <div className="flex flex-wrap gap-2">
                            {profile.hobbies.map((hobby, i) => (
                              <Badge key={i} variant="secondary" className="bg-primary/20 text-primary">
                                {hobby}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Хобби не указаны</p>
                      )}
                      
                      {profile?.talents && profile.talents.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-muted-foreground mb-2 block">Таланты</Label>
                          <div className="flex flex-wrap gap-2">
                            {profile.talents.map((talent, i) => (
                              <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                                ⭐ {talent}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {profile?.looking_for && (
                        <div className="mt-4">
                          <Label className="text-muted-foreground mb-2 block">Ищу</Label>
                          <p>{profile.looking_for}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-3 block">Хобби</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HOBBY_OPTIONS.map((hobby) => (
                            <button
                              key={hobby.id}
                              type="button"
                              onClick={() => {
                                const current = editData.hobbies || [];
                                const newHobbies = current.includes(hobby.label)
                                  ? current.filter(h => h !== hobby.label)
                                  : [...current, hobby.label];
                                setEditData({...editData, hobbies: newHobbies});
                              }}
                              className={`p-3 rounded-lg border text-sm transition-all ${
                                (editData.hobbies || []).includes(hobby.label)
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'border-white/10 hover:border-primary/30'
                              }`}
                            >
                              <hobby.icon className="w-5 h-5 mx-auto mb-1" />
                              {hobby.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-3 block">Таланты</Label>
                        <div className="flex flex-wrap gap-2">
                          {TALENT_OPTIONS.map((talent) => (
                            <button
                              key={talent}
                              type="button"
                              onClick={() => {
                                const current = editData.talents || [];
                                const newTalents = current.includes(talent)
                                  ? current.filter(t => t !== talent)
                                  : [...current, talent];
                                setEditData({...editData, talents: newTalents});
                              }}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                (editData.talents || []).includes(talent)
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'border-white/10 hover:border-primary/30'
                              }`}
                            >
                              {talent}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-2 block">Ищу</Label>
                        <div className="flex flex-wrap gap-2">
                          {LOOKING_FOR_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setEditData({...editData, looking_for: option})}
                              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                editData.looking_for === option
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'border-white/10 hover:border-primary/30'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" /> Личные данные
                  </h3>
                  
                  {!editing ? (
                    <div className="space-y-4">
                      {profile?.height && (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Рост:</Label>
                          <p className="font-medium">{profile.height} см</p>
                        </div>
                      )}
                      {profile?.education && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Образование:</Label>
                          <p className="font-medium">{profile.education}</p>
                        </div>
                      )}
                      {profile?.occupation && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Работа:</Label>
                          <p className="font-medium">{profile.occupation}</p>
                        </div>
                      )}
                      {profile?.languages && profile.languages.length > 0 && (
                        <div>
                          <Label className="text-muted-foreground">Языки:</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {profile.languages.map((lang, i) => (
                              <Badge key={i} variant="secondary" className="glass">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile?.relationship_status && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Семейное положение:</Label>
                          <p className="font-medium">
                            {RELATIONSHIP_OPTIONS.find(r => r.value === profile.relationship_status)?.label || profile.relationship_status}
                          </p>
                        </div>
                      )}
                      {profile?.children && (
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Дети:</Label>
                          <p className="font-medium">
                            {CHILDREN_OPTIONS.find(c => c.value === profile.children)?.label || profile.children}
                          </p>
                        </div>
                      )}
                      {profile?.smoking && (
                        <div className="flex items-center gap-2">
                          <Cigarette className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Курение:</Label>
                          <p className="font-medium">
                            {SMOKING_OPTIONS.find(s => s.value === profile.smoking)?.label || profile.smoking}
                          </p>
                        </div>
                      )}
                      {profile?.alcohol && (
                        <div className="flex items-center gap-2">
                          <Wine className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-muted-foreground">Алкоголь:</Label>
                          <p className="font-medium">
                            {ALCOHOL_OPTIONS.find(a => a.value === profile.alcohol)?.label || profile.alcohol}
                          </p>
                        </div>
                      )}
                      {(profile?.looking_for_gender || profile?.looking_for_age_min || profile?.looking_for_age_max) && (
                        <div className="pt-4 border-t border-white/10">
                          <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-primary" /> Кого я ищу
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {profile?.looking_for_gender && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label className="text-muted-foreground">Пол:</Label>
                                <p className="font-medium">
                                  {profile.looking_for_gender === 'female' ? 'Женщина' : profile.looking_for_gender === 'male' ? 'Мужчина' : 'Любой'}
                                </p>
                              </div>
                            )}
                            {(profile?.looking_for_age_min || profile?.looking_for_age_max) && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <Label className="text-muted-foreground">Возраст:</Label>
                                <p className="font-medium">
                                  {profile.looking_for_age_min || '18'} - {profile.looking_for_age_max || '50'} лет
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {!profile?.height && !profile?.education && !profile?.occupation && (
                        <p className="text-muted-foreground">Данные не указаны. Нажмите "Редактировать" для заполнения.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Рост (см)</Label>
                          <Input
                            type="number"
                            min="100"
                            max="220"
                            value={editData.height}
                            onChange={(e) => setEditData({...editData, height: parseInt(e.target.value) || 170})}
                            className="glass"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Образование</Label>
                          <select
                            value={editData.education}
                            onChange={(e) => setEditData({...editData, education: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {EDUCATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Профессия / Работа</Label>
                        <Input
                          placeholder="Например: Инженер, Врач, Дизайнер..."
                          value={editData.occupation}
                          onChange={(e) => setEditData({...editData, occupation: e.target.value})}
                          className="glass"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Языки</Label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGE_OPTIONS.map((lang) => {
                            const isSelected = editData.languages.includes(lang);
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => toggleLanguage(lang)}
                                className={`py-1.5 px-3 rounded-full text-sm border transition-all ${
                                  isSelected 
                                    ? 'bg-primary/20 border-primary text-primary' 
                                    : 'glass border-white/10 hover:border-primary/50'
                                }`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Семейное положение</Label>
                          <select
                            value={editData.relationship_status}
                            onChange={(e) => setEditData({...editData, relationship_status: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {RELATIONSHIP_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Дети</Label>
                          <select
                            value={editData.children}
                            onChange={(e) => setEditData({...editData, children: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {CHILDREN_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Курение</Label>
                          <select
                            value={editData.smoking}
                            onChange={(e) => setEditData({...editData, smoking: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {SMOKING_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Алкоголь</Label>
                          <select
                            value={editData.alcohol}
                            onChange={(e) => setEditData({...editData, alcohol: e.target.value})}
                            className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                          >
                            <option value="">Выберите...</option>
                            {ALCOHOL_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary" /> Кого я ищу
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Пол</Label>
                            <select
                              value={editData.looking_for_gender}
                              onChange={(e) => setEditData({...editData, looking_for_gender: e.target.value})}
                              className="w-full rounded-lg px-4 py-3 border border-input bg-background"
                            >
                              <option value="">Любой</option>
                              <option value="female">Женщина</option>
                              <option value="male">Мужчина</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Возраст от</Label>
                            <Input
                              type="number"
                              min="18"
                              max="70"
                              value={editData.looking_for_age_min}
                              onChange={(e) => setEditData({...editData, looking_for_age_min: parseInt(e.target.value) || 18})}
                              className="glass"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label>Возраст до</Label>
                          <Input
                            type="number"
                            min="18"
                            max="70"
                            value={editData.looking_for_age_max}
                            onChange={(e) => setEditData({...editData, looking_for_age_max: parseInt(e.target.value) || 50})}
                            className="glass"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> ИИ Анализ личности
                  </h3>
                  
                  {(() => {
                    let assessmentResults = null;
                    if (profile?.bio && profile.bio.includes("ИИ_АНАЛИЗ_START")) {
                      try {
                        const match = profile.bio.match(/ИИ_АНАЛИЗ_START(.+?)ИИ_АНАЛИЗ_END/);
                        if (match) {
                          assessmentResults = JSON.parse(match[1]);
                        }
                      } catch (e) {
                        console.error("Error parsing assessment results:", e);
                      }
                    }
                    
                    if (!assessmentResults) {
                      return (
                        <div className="text-center py-8">
                          <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground mb-4">Вы ещё не прошли ИИ тестирование</p>
                          <Link href="/assessment">
                            <Button className="rounded-full neo-glow">
                              <Sparkles className="w-4 h-4 mr-2" /> Пройти тест
                            </Button>
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-pink-500/20 border border-primary/30">
                          <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-6 h-6 text-primary" />
                            <span className="text-lg font-bold">Ваш тип личности</span>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {assessmentResults.personalityType || "Тип определён"}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              <span className="font-medium">Ваши сильные стороны</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(assessmentResults.strengths || []).map((s: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-5 h-5 text-pink-400" />
                              <span className="font-medium">Идеальный партнёр</span>
                            </div>
                            <p className="text-sm">
                              {assessmentResults.idealPartner || "Определяется..."}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-5 h-5 text-blue-400" />
                              <span className="font-medium">Стиль свиданий</span>
                            </div>
                            <p className="text-sm">
                              {assessmentResults.datingStyle || "Определяется..."}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-green-400" />
                              <span className="font-medium">Тест пройден</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {assessmentResults.completedAt ? new Date(assessmentResults.completedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </p>
                          </div>
                        </div>

                        <Link href="/assessment">
                          <Button variant="outline" className="w-full rounded-full">
                            <Sparkles className="w-4 h-4 mr-2" /> Пройти заново
                          </Button>
                        </Link>
                      </div>
                    );
                  })()}
                </GlassCard>
              </TabsContent>

              <TabsContent value="photos" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Фотоальбом
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Загрузите фотографии, чтобы другие пользователи могли узнать вас лучше. Первое фото станет вашим аватаром.
                  </p>
                  
                  {!editing ? (
                    <div className="mb-4 p-4 rounded-lg bg-card border border-border">
                      <Label className="text-foreground/70 text-sm">Кто может видеть альбом:</Label>
                      <p className="font-medium text-foreground mt-1">
                        {profile?.photos_visibility === "all" && "Все пользователи"}
                        {profile?.photos_visibility === "matches" && "Только совпадения"}
                        {profile?.photos_visibility === "none" && "Никто"}
                        {(!profile?.photos_visibility || profile?.photos_visibility === "all") && "Все пользователи"}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-2">
                      <Label className="text-foreground font-medium">Кто может видеть альбом</Label>
                      <select
                        value={editData.photos_visibility}
                        onChange={(e) => setEditData({...editData, photos_visibility: e.target.value})}
                        className="w-full rounded-lg px-4 py-3 bg-background border border-input text-foreground"
                      >
                        <option value="all">Все пользователи</option>
                        <option value="matches">Только совпадения (лайки)</option>
                        <option value="none">Никто (только я)</option>
                      </select>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="mb-4 rounded-full"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Загрузить фото
                  </Button>

                  <div className="grid grid-cols-3 gap-2">
                    {editData.photos && editData.photos.length > 0 ? (
                      editData.photos.map((photo, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setAvatarFromPhoto(photo, index)}
                              className="rounded-full"
                            >
                              {index === 0 ? 'Аватар' : 'Сделать аватар'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePhoto(index)}
                              className="rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-12 text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Фотографии пока не загружены</p>
                        <p className="text-sm">Нажмите "Загрузить фото" чтобы добавить</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5" /> Видимость профиля
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Выберите, кто может видеть ваш профиль и фото.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Кто может видеть мой профиль</Label>
                      <select
                        value={editing ? editData.profile_visibility : profile?.profile_visibility || "all"}
                        onChange={(e) => {
                          if (editing) {
                            setEditData({...editData, profile_visibility: e.target.value});
                          }
                        }}
                        className="w-full rounded-lg px-4 py-3 bg-background border border-input"
                      >
                        <option value="all">🌎 Все пользователи</option>
                        <option value="matches">💕 Только взаимные лайки</option>
                        <option value="none">🔒 Только я</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Кто может видеть мои фото</Label>
                      <select
                        value={editing ? editData.photos_visibility : profile?.photos_visibility || "all"}
                        onChange={(e) => {
                          if (editing) {
                            setEditData({...editData, photos_visibility: e.target.value});
                          }
                        }}
                        className="w-full rounded-lg px-4 py-3 bg-background border border-input"
                      >
                        <option value="all">🌎 Все пользователи</option>
                        <option value="matches">💕 Только взаимные лайки</option>
                        <option value="none">🔒 Только я</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm text-amber-200">
                        <strong>💡 Совет:</strong> Настройка "Только взаимные лайки" позволяет видеть ваш профиль только тем, кто вам понравился и поставил лайк в ответ. Это помогает создать более приватную атмосферу для знакомств.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Настройки аккаунта
                  </h3>
                  
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start rounded-lg glass" asChild>
                      <Link href="/legal/privacy">
                        <Shield className="w-4 h-4 mr-2" />
                        Политика конфиденциальности
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start rounded-lg glass" asChild>
                      <Link href="/legal/terms">
                        <Shield className="w-4 h-4 mr-2" />
                        Правила сервиса
                      </Link>
                    </Button>

                    <Button variant="outline" className="w-full justify-start rounded-lg glass" asChild>
                      <Link href="/legal/offer">
                        <Shield className="w-4 h-4 mr-2" />
                        Оферта
                      </Link>
                    </Button>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-destructive/30">
                  <h3 className="text-lg font-bold mb-4 text-destructive flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Опасная зона
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Удаление аккаунта приведёт к безвозвратной потере всех данных.
                  </p>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="w-full rounded-lg"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Удалить аккаунт
                  </Button>
                </GlassCard>

                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full rounded-lg"
                >
                  Выйти из аккаунта
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выберите город</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {geoLoading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Определение местоположения...</span>
              </div>
            ) : city ? (
              <div className="text-center py-4">
                <p className="text-lg font-medium">{city}</p>
                <p className="text-sm text-muted-foreground">Город определён автоматически</p>
              </div>
            ) : latitude && longitude ? (
              <div className="space-y-3 text-center">
                <p className="text-muted-foreground">Город не определён</p>
                <Button onClick={() => refreshGeo()}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              </div>
            ) : geoError ? (
              <div className="space-y-3 text-center">
                <p className="text-muted-foreground">{geoError}</p>
                <Button onClick={() => refreshGeo()}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-muted-foreground">Местоположение не определено</p>
                <Button onClick={() => refreshGeo()}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Определить
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCityDialog(false)}>
              Отмена
            </Button>
            {city && (
              <Button onClick={async () => {
                if (user) {
                  await supabase.from('profiles').update({ city, latitude, longitude }).eq('id', user.id);
                  await refreshProfile();
                  setShowCityDialog(false);
                }
              }}>
                Сохранить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}