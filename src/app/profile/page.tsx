"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Mail, Edit, Save, Shield, Heart, Sparkles, Music, Book, Camera, Gamepad, Code, TreePine, Utensils, Dumbbell, Globe, MapPin, Eye, Share2, Check, CheckCircle, AlertCircle, Zap } from "lucide-react";
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
  const { user, profile, loading: authLoading, refreshProfile } = useSupabase();
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

  useEffect(() => {
    if (user) {
      fetchStats().catch(() => setStats(s => ({ ...s, matches: 0 })));
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
                    <h2 className="text-lg font-bold">{profile?.full_name || "Пользователь"}</h2>
                    <p className="text-muted-foreground text-xs">@{profile?.username || "username"}</p>
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
                <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /><span>Участник с {memberSince}</span></div>
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
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Основная информация</h3>
                  {!editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-muted-foreground">Имя</Label><p className="font-medium">{profile?.full_name || "Не указано"}</p></div>
                        <div><Label className="text-muted-foreground">Username</Label><p className="font-medium">@{profile?.username || "Не указан"}</p></div>
                      </div>
                      {age && <div><Label className="text-muted-foreground">Возраст</Label><p className="font-medium">{age} лет</p></div>}
                      {profile?.birth_date && <div><Label className="text-muted-foreground">Дата рождения</Label><p className="font-medium">{new Date(profile.birth_date).toLocaleDateString('ru-RU')}</p></div>}
                      {profile?.gender && <div><Label className="text-muted-foreground">Пол</Label><p className="font-medium">{GENDER_OPTIONS.find(g => g.value === profile.gender)?.label || profile.gender}</p></div>}
                      <div><Label className="text-muted-foreground">Биография</Label><p className="font-medium">{profile?.bio || "Не указано"}</p></div>
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
                      {profile?.hobbies?.length ? (
                        <div><Label className="text-muted-foreground mb-2 block">Хобби</Label>
                          <div className="flex flex-wrap gap-2">{profile.hobbies.map((h, i) => <Badge key={i} variant="secondary" className="bg-primary/20">{h}</Badge>)}</div>
                        </div>
                      ) : <p className="text-muted-foreground text-sm">Хобби не указаны</p>}
                      {profile?.talents?.length && (
                        <div className="mt-4"><Label className="text-muted-foreground mb-2 block">Таланты</Label>
                          <div className="flex flex-wrap gap-2">{profile.talents.map((t, i) => <Badge key={i} variant="outline" className="border-primary/30 text-primary">⭐ {t}</Badge>)}</div>
                        </div>
                      )}
                      {profile?.looking_for && <div className="mt-4"><Label className="text-muted-foreground mb-2 block">Ищу</Label><p>{profile.looking_for}</p></div>}
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
                        <Input value={editData.looking_for} onChange={(e) => setEditData({ ...editData, looking_for: e.target.value })} className="glass" placeholder="Серьёзные отношения, дружба..." />
                      </div>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold mb-4">Анкета</h3>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Рост (см)</Label><Input type="number" value={editData.height} onChange={(e) => setEditData({ ...editData, height: parseInt(e.target.value) || 170 })} className="glass" /></div>
                        <div className="space-y-2"><Label>Образование</Label><Input value={editData.education} onChange={(e) => setEditData({ ...editData, education: e.target.value })} className="glass" /></div>
                      </div>
                      <div className="space-y-2"><Label>Профессия</Label><Input value={editData.occupation} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} className="glass" /></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile?.height && <div><Label className="text-muted-foreground">Рост</Label><p className="font-medium">{profile.height} см</p></div>}
                      {profile?.education && <div><Label className="text-muted-foreground">Образование</Label><p className="font-medium">{profile.education}</p></div>}
                      {profile?.occupation && <div><Label className="text-muted-foreground">Профессия</Label><p className="font-medium">{profile.occupation}</p></div>}
                      {!profile?.height && !profile?.education && <p className="text-muted-foreground text-sm">Данные не заполнены</p>}
                    </div>
                  )}
                </GlassCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}