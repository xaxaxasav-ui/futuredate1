"use client";

import { useState, useEffect, useRef } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, User, Mail, Edit, Save, Shield, Heart, Sparkles, Music, Book, Camera, Gamepad, Code, TreePine, Utensils, Dumbbell, Globe, MapPin, Eye, Share2, Check, CheckCircle, AlertCircle, Zap, Upload, X, Gift, Settings, Trash2, Baby, Cigarette, Wine, GraduationCap, Briefcase, Ruler, HeartHandshake, Clock, BrainCircuit, Image as ImageIcon } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
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

const GENDER_OPTIONS = [
  { value: "male", label: "Мужчина" },
  { value: "female", label: "Женщина" },
  { value: "other", label: "Другое" },
];

const EDUCATION_OPTIONS = ["Среднее", "Среднее специальное", "Незаконченное высшее", "Бакалавр", "Магистр", "Кандидат наук", "Доктор наук", "Высшее"];
const RELATIONSHIP_OPTIONS = [
  { value: "single", label: "Не в отношениях" },
  { value: "dating", label: "В отношениях" },
  { value: "engaged", label: "Помолвлен(а)" },
  { value: "married", label: "Женат/Замужем" },
  { value: "divorced", label: "Разведён(а)" },
  { value: "complicated", label: "Всё сложно" },
];
const CHILDREN_OPTIONS = [
  { value: "none", label: "Нет детей" },
  { value: "one", label: "Один ребёнок" },
  { value: "two", label: "Двое детей" },
  { value: "three", label: "Трое и более" },
];
const SMOKING_OPTIONS = [
  { value: "no", label: "Нет" },
  { value: "yes", label: "Да" },
  { value: "sometimes", label: "Иногда" },
];
const ALCOHOL_OPTIONS = [
  { value: "no", label: "Нет" },
  { value: "yes", label: "Да" },
  { value: "sometimes", label: "Иногда" },
];
const LOOKING_FOR_OPTIONS = ["Серьёзные отношения", "Дружба", "Не определился", "Общение"];
const LANGUAGE_OPTIONS = ["Русский", "Английский", "Немецкий", "Французский", "Испанский", "Итальянский", "Китайский", "Японский"];

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

interface AssessmentResult {
  completedAt: string;
  personalityType: string;
  strengths?: string[];
  idealPartner?: string;
  datingStyle?: string;
}

interface GiftData {
  id: string;
  name: string;
  emoji: string;
}

interface ReceivedGift {
  id: string;
  gift_name: string;
  gift_emoji: string | null;
  sender: { full_name: string | null } | null;
  created_at: string;
}

interface SentGift {
  id: string;
  gift_name: string;
  gift_emoji: string | null;
  receiver: { full_name: string | null } | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, profileLoading, signOut, refreshProfile } = useSupabase();
  const { latitude, longitude, city, loading: geoLoading } = useGeolocation();
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ views: 0, likes: 0, messages: 0, matches: 0 });
  const [editData, setEditData] = useState({
    full_name: "", bio: "", username: "", hobbies: [] as string[], talents: [] as string[],
    looking_for: "", looking_for_gender: "", looking_for_age_min: 18, looking_for_age_max: 50,
    looking_for_height_min: 150, looking_for_height_max: 200, birth_date: "", gender: "",
    height: 170, education: "", occupation: "", languages: [] as string[],
    relationship_status: "", children: "", smoking: "", alcohol: "",
    photos: [] as string[], photos_visibility: "all", photos_blocked_users: [] as string[],
    profile_visibility: "all", profile_blocked_users: [] as string[],
  });
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [giftsTab, setGiftsTab] = useState<'received' | 'sent'>('received');
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftsError, setGiftsError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchStats().catch(() => setStats(s => ({ ...s, matches: 0 })));
      loadReceivedGifts().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user && !profile && !authLoading) {
      refreshProfile();
    }
  }, [user, profile, authLoading, refreshProfile]);

  useEffect(() => {
    if (profile && !initialLoadDone) {
      setEditData({
        full_name: profile.full_name || "", bio: profile.bio || "", username: profile.username || "",
        hobbies: profile.hobbies || [], talents: profile.talents || [],
        looking_for: profile.looking_for || "", looking_for_gender: profile.looking_for_gender || "",
        looking_for_age_min: profile.looking_for_age_min || 18, looking_for_age_max: profile.looking_for_age_max || 50,
        looking_for_height_min: profile.looking_for_height_min || 150, looking_for_height_max: profile.looking_for_height_max || 200,
        birth_date: profile.birth_date || "", gender: profile.gender || "", height: profile.height || 170,
        education: profile.education || "", occupation: profile.occupation || "",
        languages: profile.languages || [], relationship_status: profile.relationship_status || "",
        children: profile.children || "", smoking: profile.smoking || "", alcohol: profile.alcohol || "",
        photos: profile.photos || [], photos_visibility: profile.photos_visibility || "all",
        photos_blocked_users: profile.photos_blocked_users || [], profile_visibility: profile.profile_visibility || "all",
        profile_blocked_users: profile.profile_blocked_users || [],
      });
      setInputName(profile.full_name || ""); setInputUsername(profile.username || ""); setInitialLoadDone(true);
    }
  }, [profile, initialLoadDone, refreshProfile]);

  useEffect(() => {
    if (!initialLoadDone && profile) {
      setEditData(prev => ({
        ...prev,
        photos: profile?.photos || prev.photos
      }));
    }
  }, [profile, initialLoadDone]);

  useEffect(() => {
    const saveGeo = async () => {
      if (!user || !latitude || !longitude || profile?.latitude) return;
      try {
        await supabase.from('profiles').update({ latitude, longitude, city: city || null }).eq('id', user.id);
      } catch {}
    };
    if (!geoLoading && latitude && longitude && user && profile) saveGeo();
  }, [latitude, longitude, city, geoLoading, user, profile, refreshProfile]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [likes, views, matches] = await Promise.all([
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('liked_user_id', user.id),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_id', user.id),
        supabase.from('matches').select('id', { count: 'exact', head: true }).or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`).eq('status', 'accepted')
      ]);
      setStats({ views: views.count || 0, likes: likes.count || 0, messages: 0, matches: matches.count || 0 });
    } catch {}
  };

  const loadReceivedGifts = async () => {
    if (!user) return;
    setLoadingGifts(true);
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*, sender:profiles!receiver_id(full_name)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setReceivedGifts(data || []);
    } catch (e: any) {
      console.log('📦 Gifts query error:', e);
      setGiftsError(e.message);
    } finally {
      setLoadingGifts(false);
    }
  };

  const loadSentGifts = async () => {
    if (!user) return;
    setLoadingGifts(true);
    setGiftsError(null);
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*, receiver:profiles!sender_id(full_name)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setSentGifts(data || []);
    } catch (e: any) {
      console.log('📦 Sent gifts query result:', { data: null, error: e });
      setGiftsError(e.message);
    } finally {
      setLoadingGifts(false);
    }
  };

  useEffect(() => {
    if (giftsTab === 'sent' && sentGifts.length === 0 && !giftsError) {
      loadSentGifts();
    }
  }, [giftsTab]);

  const getReferralCode = () => profile?.username || user?.id?.slice(0, 8) || 'user';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${getReferralCode()}` : '';
  
  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const shareProfile = async () => {
    if (navigator.share && navigator.canShare?.({ title: 'Свидание будущего AI', text: 'Присоединяйся к знакомствам нового поколения!', url: referralLink })) {
      try { await navigator.share({ title: 'Свидание будущего AI', text: 'Присоединяйся к знакомствам нового поколения!', url: referralLink }); } catch { copyToClipboard(); }
    } else { copyToClipboard(); }
  };

  const handleSave = async () => {
    if (!user) { alert("Вы не авторизованы"); return; }
    setLoading(true);
    try {
      const profileData = {
        full_name: editData.full_name, bio: editData.bio, username: editData.username || `user_${user.id.slice(0,8)}`,
        hobbies: editData.hobbies, talents: editData.talents, looking_for: editData.looking_for,
        looking_for_gender: editData.looking_for_gender || null, looking_for_age_min: editData.looking_for_age_min,
        looking_for_age_max: editData.looking_for_age_max, looking_for_height_min: editData.looking_for_height_min,
        looking_for_height_max: editData.looking_for_height_max, birth_date: editData.birth_date || null,
        gender: editData.gender || null, height: editData.height, education: editData.education || null,
        occupation: editData.occupation || null, languages: editData.languages,
        relationship_status: editData.relationship_status || null, children: editData.children || null,
        smoking: editData.smoking || null, alcohol: editData.alcohol || null, photos: editData.photos,
        photos_visibility: editData.photos_visibility, photos_blocked_users: editData.photos_blocked_users,
        profile_visibility: editData.profile_visibility, profile_blocked_users: editData.profile_blocked_users,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('profiles').upsert({ id: user.id, ...profileData }).select();
      if (error) throw error;
      await refreshProfile(); setEditing(false); alert("Профиль сохранен!");
    } catch (e: any) { alert("Ошибка: " + (e?.message || "Неизвестная ошибка")); }
    finally { setLoading(false); }
  };

  const toggleHobby = (hobbyLabel: string) => {
    setEditData(prev => ({ ...prev, hobbies: prev.hobbies.includes(hobbyLabel) ? prev.hobbies.filter(h => h !== hobbyLabel) : [...prev.hobbies, hobbyLabel] }));
  };

  const toggleTalent = (talent: string) => {
    setEditData(prev => ({ ...prev, talents: prev.talents.includes(talent) ? prev.talents.filter(t => t !== talent) : [...prev.talents, talent] }));
  };

  const toggleLanguage = (lang: string) => {
    setEditData(prev => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter(l => l !== lang) : [...prev.languages, lang] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setUploadingPhoto(true);
    const file = e.target.files[0];
    
    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newPhotoUrl = urlData.publicUrl;
      
      const newPhotos = [...editData.photos, newPhotoUrl];
      setEditData(prev => ({ ...prev, photos: newPhotos }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Ошибка загрузки фото');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = editData.photos.filter((_, i) => i !== index);
    setEditData(prev => ({ ...prev, photos: newPhotos }));
  };

  const setAvatarFromPhoto = (photoUrl: string, index: number) => {
    const newPhotos = [photoUrl, ...editData.photos.filter((_, i) => i !== index)];
    setEditData(prev => ({ ...prev, photos: newPhotos }));
  };

  const handleSignOut = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      await signOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm('Вы уверены? Это действие необратимо!')) return;
    
    setLoading(true);
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.admin.deleteUser(user.id);
      await signOut();
    } catch (e: any) {
      alert('Ошибка удаления аккаунта');
    } finally {
      setLoading(false);
    }
  };

  const assessment = (() => {
    if (profile?.bio && profile.bio.includes('ИИ_АНАЛИЗ_START')) {
      try {
        const match = profile.bio.match(/ИИ_АНАЛИЗ_START(\{.*?\})ИИ_АНАЛИЗ_END/);
        if (match) {
          return JSON.parse(match[1]) as AssessmentResult;
        }
      } catch (e) {
        console.error('Error parsing assessment:', e);
      }
    }
    return null;
  })();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  const effectiveProfile = profile || {
    id: user.id, username: `user_${user.id.slice(0,8)}`, full_name: user.email?.split('@')[0] || 'Пользователь',
    avatar_url: null, bio: null, created_at: new Date().toISOString(), phone: null, gender: null,
    birth_date: null, city: null, height: null, education: null, occupation: null, relationship_status: null,
    children: null, hobbies: [] as string[], talents: [] as string[], looking_for: null, is_verified: false,
  };

  const avatarUrl = effectiveProfile.avatar_url?.startsWith('blob:') ? PlaceHolderImages[1].imageUrl : effectiveProfile.avatar_url || PlaceHolderImages[1].imageUrl;
  const memberSince = effectiveProfile.created_at ? new Date(effectiveProfile.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : 'Неизвестно';
  const age = effectiveProfile.birth_date ? calculateAge(effectiveProfile.birth_date) : null;

  const completion = (() => {
    let score = 0;
    const fields = [effectiveProfile.avatar_url, effectiveProfile.full_name, effectiveProfile.bio, effectiveProfile.birth_date,
      effectiveProfile.gender, effectiveProfile.city, effectiveProfile.height, effectiveProfile.education, effectiveProfile.occupation,
      effectiveProfile.hobbies?.length, effectiveProfile.talents?.length];
    fields.forEach(f => { if (f && (typeof f !== 'number' || f > 0)) score += 9; });
    return Math.min(score, 100);
  })();

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Профиль</h1>
            <p className="text-muted-foreground text-sm">Управление данными</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="glass rounded-full text-sm">К поиску</Button>
          </Link>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-3 text-center"><Eye className="w-5 h-5 mx-auto mb-1 text-blue-400" /><p className="text-xl font-bold">{stats.views}</p><p className="text-[10px] text-muted-foreground">Просмотров</p></GlassCard>
          <GlassCard className="p-3 text-center"><Heart className="w-5 h-5 mx-auto mb-1 text-pink-400" /><p className="text-xl font-bold">{stats.likes}</p><p className="text-[10px] text-muted-foreground">Лайков</p></GlassCard>
          <GlassCard className="p-3 text-center"><Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" /><p className="text-xl font-bold">{stats.matches}</p><p className="text-[10px] text-muted-foreground">Совпадений</p></GlassCard>
        </div>

        <GlassCard className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Заполненность</span>
            <span className={`text-sm font-bold ${completion >= 70 ? 'text-green-400' : completion >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{completion}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${completion >= 70 ? 'bg-green-400' : completion >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${completion}%` }} />
          </div>
        </GlassCard>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <GlassCard className="p-4">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-primary/30 mb-4">
                <img src={avatarUrl} alt="Аватар" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PlaceHolderImages[1].imageUrl; }} />
              </div>

              <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="font-bold text-xs">Верификация</span>
                </div>
                {profile?.is_verified === true ? (
                  <Badge className="bg-green-500/20 text-green-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Верифицирован</Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 text-xs"><AlertCircle className="w-3 h-3 mr-1" /> Не верифицирован</Badge>
                )}
                {effectiveProfile.is_verified !== true && (
                  <Link href="/verification" className="block mt-2">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs py-1">Верификация</Button>
                  </Link>
                )}
              </div>

              <div className="text-center mt-3">
                {!editing ? (
                  <>
                    <h2 className="text-lg font-bold">{effectiveProfile.full_name || "Пользователь"}</h2>
                    <p className="text-muted-foreground text-xs">@{effectiveProfile.username || "username"}</p>
                    {age && <p className="text-muted-foreground text-xs">{age} лет</p>}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Input placeholder="Ваше имя" value={inputName} onChange={(e) => { setInputName(e.target.value); setEditData({ ...editData, full_name: e.target.value }); }} className="text-center" />
                    <Input placeholder="Username" value={inputUsername} onChange={(e) => { setInputUsername(e.target.value); setEditData({ ...editData, username: e.target.value }); }} className="text-center" />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /><span className="truncate">{user?.email}</span></div>
                {profile?.city && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{profile.city}</span></div>}
                {city && !profile?.city && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{city}</span></div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>Участник с {memberSince}</span></div>
              </div>

              {profile && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {profile.gender && <Badge variant="outline" className="text-xs">{profile.gender === 'male' ? '👨 Мужчина' : profile.gender === 'female' ? '👩 Женщина' : '👤'}</Badge>}
                  {profile.height && <Badge variant="outline" className="text-xs">📏 {profile.height} см</Badge>}
                  {profile.education && <Badge variant="outline" className="text-xs">🎓 {profile.education}</Badge>}
                </div>
              )}

              <Button onClick={shareProfile} variant="outline" className="w-full rounded-full mt-4">
                {copied ? <><Check className="w-4 h-4 mr-2" /> Скопировано!</> : <><Share2 className="w-4 h-4 mr-2" /> Поделиться</>}
              </Button>

              <div className="mt-6 space-y-2">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="w-full rounded-full bg-primary"><Edit className="w-4 h-4 mr-2" /> Редактировать</Button>
                ) : (
                  <>
                    <Button onClick={handleSave} disabled={loading} className="w-full rounded-full bg-primary">{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Сохранить</Button>
                    <Button onClick={() => setEditing(false)} variant="outline" className="w-full rounded-full">Отмена</Button>
                  </>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="flex w-full overflow-x-auto pb-2 gap-1">
                <TabsTrigger value="info" className="text-xs px-3 py-2">Обо мне</TabsTrigger>
                <TabsTrigger value="interests" className="text-xs px-3 py-2">Интересы</TabsTrigger>
                <TabsTrigger value="details" className="text-xs px-3 py-2">Анкета</TabsTrigger>
                <TabsTrigger value="photos" className="text-xs px-3 py-2">📷 Фото</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs px-3 py-2">🤖 ИИ</TabsTrigger>
                <TabsTrigger value="gifts" className="text-xs px-3 py-2">🎁 Подарки</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs px-3 py-2">⚙️</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Основная информация</h3>
                  {!editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-muted-foreground">Имя</Label><p className="font-medium">{effectiveProfile.full_name || "Не указано"}</p></div>
                        <div><Label className="text-muted-foreground">Username</Label><p className="font-medium">@{effectiveProfile.username || "Не указан"}</p></div>
                      </div>
                      {age && <div><Label className="text-muted-foreground">Возраст</Label><p className="font-medium">{age} лет</p></div>}
                      {effectiveProfile.birth_date && <div><Label className="text-muted-foreground">Дата рождения</Label><p className="font-medium">{new Date(effectiveProfile.birth_date).toLocaleDateString('ru-RU')}</p></div>}
                      {effectiveProfile.gender && <div><Label className="text-muted-foreground">Пол</Label><p className="font-medium">{GENDER_OPTIONS.find(g => g.value === effectiveProfile.gender)?.label || effectiveProfile.gender}</p></div>}
                      <div><Label className="text-muted-foreground">Биография</Label><p className="font-medium">{effectiveProfile.bio || "Не указано"}</p></div>
                      <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{user?.email}</p></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Дата рождения</Label>
                          <Input type="date" value={editData.birth_date} onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })} className="glass" />
                        </div>
                        <div className="space-y-2">
                          <Label>Пол</Label>
                          <select value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Биография</Label>
                        <Textarea placeholder="Расскажите о себе..." value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} className="glass" rows={6} />
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="interests" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Интересы и увлечения</h3>
                  {!editing ? (
                    <div className="space-y-4">
                      {effectiveProfile.hobbies?.length ? (
                        <div><Label className="text-muted-foreground mb-2 block">Хобби</Label>
                          <div className="flex flex-wrap gap-2">{effectiveProfile.hobbies.map((h, i) => <Badge key={i} variant="secondary" className="bg-primary/20">{h}</Badge>)}</div>
                        </div>
                      ) : <p className="text-muted-foreground text-sm">Хобби не указаны</p>}
                      {effectiveProfile.talents?.length && (
                        <div className="mt-4"><Label className="text-muted-foreground mb-2 block">Таланты</Label>
                          <div className="flex flex-wrap gap-2">{effectiveProfile.talents.map((t, i) => <Badge key={i} variant="outline" className="border-primary/30 text-primary">⭐ {t}</Badge>)}</div>
                        </div>
                      )}
                      {effectiveProfile.looking_for && <div className="mt-4"><Label className="text-muted-foreground mb-2 block">Ищу</Label><p>{effectiveProfile.looking_for}</p></div>}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-3 block">Хобби</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HOBBY_OPTIONS.map(h => (
                            <button key={h.id} type="button" onClick={() => toggleHobby(h.label)}
                              className={`p-3 rounded-lg border text-sm ${editData.hobbies.includes(h.label) ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 hover:border-primary/30'}`}>
                              <h.icon className="w-5 h-5 mx-auto mb-1" />{h.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-3 block">Таланты</Label>
                        <div className="flex flex-wrap gap-2">
                          {TALENT_OPTIONS.map(t => (
                            <button key={t} type="button" onClick={() => toggleTalent(t)}
                              className={`px-3 py-1 rounded-full border text-sm ${editData.talents.includes(t) ? 'bg-primary/20 border-primary text-primary' : 'border-white/10'}`}>⭐ {t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ищу</Label>
                        <div className="flex flex-wrap gap-2">
                          {LOOKING_FOR_OPTIONS.map(o => (
                            <button key={o} type="button" onClick={() => setEditData({...editData, looking_for: o})}
                              className={`px-3 py-2 rounded-lg border text-sm ${editData.looking_for === o ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 hover:border-primary/30'}`}>
                              {o}
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
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Личные данные</h3>
                  {!editing ? (
                    <div className="space-y-4">
                      {effectiveProfile.height && <div className="flex items-center gap-2"><Ruler className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Рост:</Label><p className="font-medium">{effectiveProfile.height} см</p></div>}
                      {effectiveProfile.education && <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Образование:</Label><p className="font-medium">{effectiveProfile.education}</p></div>}
                      {effectiveProfile.occupation && <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Работа:</Label><p className="font-medium">{effectiveProfile.occupation}</p></div>}
                      {effectiveProfile.languages && effectiveProfile.languages.length > 0 && <div><Label className="text-muted-foreground">Языки:</Label><div className="flex flex-wrap gap-2 mt-2">{effectiveProfile.languages.map((lang, i) => <Badge key={i} variant="secondary" className="glass">{lang}</Badge>)}</div></div>}
                      {effectiveProfile.relationship_status && <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Семейное:</Label><p className="font-medium">{RELATIONSHIP_OPTIONS.find(r => r.value === effectiveProfile.relationship_status)?.label || effectiveProfile.relationship_status}</p></div>}
                      {effectiveProfile.children && <div className="flex items-center gap-2"><Baby className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Дети:</Label><p className="font-medium">{CHILDREN_OPTIONS.find(c => c.value === effectiveProfile.children)?.label || effectiveProfile.children}</p></div>}
                      {effectiveProfile.smoking && <div className="flex items-center gap-2"><Cigarette className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Курение:</Label><p className="font-medium">{SMOKING_OPTIONS.find(s => s.value === effectiveProfile.smoking)?.label || effectiveProfile.smoking}</p></div>}
                      {effectiveProfile.alcohol && <div className="flex items-center gap-2"><Wine className="w-4 h-4 text-muted-foreground" /><Label className="text-muted-foreground">Алкоголь:</Label><p className="font-medium">{ALCOHOL_OPTIONS.find(a => a.value === effectiveProfile.alcohol)?.label || effectiveProfile.alcohol}</p></div>}
                      {!effectiveProfile.height && !effectiveProfile.education && <p className="text-muted-foreground">Данные не указаны. Нажмите "Редактировать" для заполнения.</p>}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Рост (см)</Label><Input type="number" min="100" max="220" value={editData.height} onChange={(e) => setEditData({...editData, height: parseInt(e.target.value) || 170})} className="glass" /></div>
                        <div className="space-y-2">
                          <Label>Образование</Label>
                          <select value={editData.education} onChange={(e) => setEditData({...editData, education: e.target.value})} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Профессия</Label><Input placeholder="Например: Инженер..." value={editData.occupation} onChange={(e) => setEditData({...editData, occupation: e.target.value})} className="glass" /></div>
                      <div className="space-y-2">
                        <Label>Языки</Label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGE_OPTIONS.map(lang => {
                            const isSelected = editData.languages.includes(lang);
                            return (
                              <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                                className={`py-1.5 px-3 rounded-full text-sm border transition-all ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'glass border-white/10 hover:border-primary/50'}`}>
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Семейное положение</Label>
                          <select value={editData.relationship_status} onChange={(e) => setEditData({...editData, relationship_status: e.target.value})} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {RELATIONSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Дети</Label>
                          <select value={editData.children} onChange={(e) => setEditData({...editData, children: e.target.value})} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {CHILDREN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Курение</Label>
                          <select value={editData.smoking} onChange={(e) => setEditData({...editData, smoking: e.target.value})} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {SMOKING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Алкоголь</Label>
                          <select value={editData.alcohol} onChange={(e) => setEditData({...editData, alcohol: e.target.value})} className="w-full rounded-lg px-4 py-3 border bg-background">
                            <option value="">Выберите...</option>
                            {ALCOHOL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="photos" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Фотоальбом</h3>
                  <p className="text-muted-foreground mb-4">Загрузите фотографии, чтобы другие пользователи могли узнать вас лучше.</p>
                  
                  {!editing ? (
                    <div className="mb-4 p-4 rounded-lg bg-card border border-border">
                      <Label className="text-foreground/70 text-sm">Кто может видеть альбом:</Label>
                      <p className="font-medium text-foreground mt-1">
                        {profile?.photos_visibility === 'all' && 'Все пользователи'}
                        {profile?.photos_visibility === 'matches' && 'Только совпадения'}
                        {profile?.photos_visibility === 'none' && 'Никто'}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 space-y-2">
                      <Label className="text-foreground font-medium">Кто может видеть альбом</Label>
                      <select value={editData.photos_visibility} onChange={(e) => setEditData({...editData, photos_visibility: e.target.value})} className="w-full rounded-lg px-4 py-3 bg-background border border-input text-foreground">
                        <option value="all">Все пользователи</option>
                        <option value="matches">Только совпадения</option>
                        <option value="none">Никто</option>
                      </select>
                    </div>
                  )}
                  
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="mb-4 rounded-full">
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Загрузить фото
                  </Button>

                  <div className="grid grid-cols-3 gap-2">
                    {(editing ? editData.photos : (profile?.photos || [])).length > 0 ? (
                      (editing ? editData.photos : (profile?.photos || [])).map((photo, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img src={photo} alt={`Фото ${index + 1}`} className="w-full h-full object-cover rounded-lg" loading="lazy" />
                          {editing && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setAvatarFromPhoto(photo, index)} className="rounded-full text-xs">
                                {index === 0 ? 'Аватар' : 'Сделать аватар'}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeletePhoto(index)} className="rounded-full">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-12 text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Фотографии пока не загружены</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-primary" /> ИИ Анализ личности</h3>
                  
                  {!assessment ? (
                    <div className="text-center py-8">
                      <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground mb-4">Вы ещё не прошли ИИ тестирование</p>
                      <Link href="/assessment">
                        <Button className="rounded-full neo-glow"><Sparkles className="w-4 h-4 mr-2" /> Пройти тест</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-pink-500/20 border border-primary/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Sparkles className="w-6 h-6 text-primary" />
                          <span className="text-lg font-bold">Ваш тип личности</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{assessment.personalityType || "Тип определён"}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <span className="font-medium">Сильные стороны</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(assessment.strengths || []).map((s, i) => (
                              <Badge key={i} variant="secondary" className="bg-yellow-500/20 text-yellow-400">{s}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5 text-pink-400" />
                            <span className="font-medium">Идеальный партнёр</span>
                          </div>
                          <p className="text-sm">{assessment.idealPartner || "Определяется..."}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <HeartHandshake className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">Стиль свиданий</span>
                          </div>
                          <p className="text-sm">{assessment.datingStyle || "Определяется..."}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-green-400" />
                            <span className="font-medium">Тест пройден</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                      </div>

                      <Link href="/assessment">
                        <Button variant="outline" className="w-full rounded-full">
                          <Sparkles className="w-4 h-4 mr-2" /> Пройти заново
                        </Button>
                      </Link>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="gifts" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setGiftsTab('received')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${giftsTab === 'received' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      Полученные ({receivedGifts.length})
                    </button>
                    <button onClick={() => setGiftsTab('sent')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${giftsTab === 'sent' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      Отправленные ({sentGifts.length})
                    </button>
                  </div>
                  
                  {loadingGifts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : giftsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2">Ошибка: {giftsError}</p>
                      <Button variant="outline" size="sm" onClick={giftsTab === 'received' ? loadReceivedGifts : loadSentGifts}>Повторить</Button>
                    </div>
                  ) : giftsTab === 'received' ? (
                    receivedGifts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Подарков пока нет</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {receivedGifts.map(gift => (
                          <div key={gift.id} className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-3xl mb-2">{gift.gift_emoji || '🎁'}</div>
                            <p className="text-sm font-medium">{gift.gift_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">от {gift.sender?.full_name || 'неизвестно'}</p>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    sentGifts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Вы ещё не отправляли подарки</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {sentGifts.map(gift => (
                          <div key={gift.id} className="p-4 bg-muted/50 rounded-lg text-center">
                            <div className="text-3xl mb-2">{gift.gift_emoji || '🎁'}</div>
                            <p className="text-sm font-medium">{gift.gift_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">для {gift.receiver?.full_name || 'неизвестно'}</p>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Eye className="w-5 h-5" /> Видимость профиля</h3>
                  <p className="text-sm text-muted-foreground mb-4">Выберите, кто может видеть ваш профиль.</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Кто может видеть мой профиль</Label>
                      <select value={editing ? editData.profile_visibility : profile?.profile_visibility || "all"} onChange={(e) => { if (editing) setEditData({...editData, profile_visibility: e.target.value}); }} className="w-full rounded-lg px-4 py-3 bg-background border border-input">
                        <option value="all">🌎 Все пользователи</option>
                        <option value="matches">💕 Только взаимные лайки</option>
                        <option value="none">🔒 Только я</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> Настройки аккаунта</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start rounded-lg glass" asChild>
                      <Link href="/legal/privacy"><Shield className="w-4 h-4 mr-2" /> Политика конфиденциальности</Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-lg glass" asChild>
                      <Link href="/legal/terms"><Shield className="w-4 h-4 mr-2" /> Правила сервиса</Link>
                    </Button>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-destructive/30">
                  <h3 className="text-lg font-bold mb-4 text-destructive flex items-center gap-2"><Trash2 className="w-5 h-5" /> Опасная зона</h3>
                  <p className="text-sm text-muted-foreground mb-4">Удаление аккаунта приведёт к безвозвратной потере всех данных.</p>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading} className="w-full rounded-lg">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Удалить аккаунт
                  </Button>
                </GlassCard>

                <Button variant="outline" onClick={handleSignOut} className="w-full rounded-lg">Выйти из аккаунта</Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative">
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
              <X className="w-5 h-5" />
            </button>
            {selectedPhoto && <img src={selectedPhoto} alt="Фото" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}