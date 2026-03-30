"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Shield, BarChart3, Settings, Search, 
  CheckCircle, XCircle, X, Loader2, MapPin, 
  Calendar, Mail, Phone, AlertTriangle, MessageCircle, Send, Palette, Image, Save, Eye, Upload
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/components/SupabaseProvider";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface AdminProfile {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  birth_date: string | null;
  gender: string | null;
  role: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
  verification_photo: string | null;
  is_banned: boolean | null;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
}

const ADMIN_EMAILS = [
  "admin@date-future.ru",
  "admin@свидание-будущего.рф",
  "statnihx@mail.ru"
];

export default function AdminPage() {
  const { user, loading: authLoading } = useSupabase();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [editData, setEditData] = useState({
    full_name: "",
    username: "",
    role: "",
    phone: ""
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalMessages: 0
  });
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [savingBg, setSavingBg] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setDebugInfo("User not logged in, showing login message");
      } else {
        checkAdminAccess();
      }
    }
  }, [authLoading, user]);

  const checkAdminAccess = async () => {
    const email = user?.email?.toLowerCase();
    setDebugInfo(`Checking admin access for: ${user?.email}`);
    
    if (!email || !ADMIN_EMAILS.includes(email)) {
      setError(`Доступ запрещён. Ваш email: ${user?.email}. Разрешённые: ${ADMIN_EMAILS.join(', ')}`);
      setDebugInfo(`Email ${email} not in admin list: ${ADMIN_EMAILS.join(', ')}`);
      return;
    }
    setDebugInfo("Admin access granted, loading data...");
    try {
      await fetchData();
    } catch (e: any) {
      console.error("Error in fetchData:", e);
      setDebugInfo(prev => prev + "\nfetchData error: " + e.message);
    }
    try {
      await fetchSupportTickets();
    } catch (e: any) {
      console.error("Error in fetchSupportTickets:", e);
      setDebugInfo(prev => prev + "\nfetchSupportTickets error: " + e.message);
    }
    try {
      await fetchDesignSettings();
    } catch (e: any) {
      console.error("Error in fetchDesignSettings:", e);
      setDebugInfo(prev => prev + "\nfetchDesignSettings error: " + e.message);
    }
  };

  const fetchDesignSettings = async () => {
    try {
      const localBg = localStorage.getItem('site_background_image');
      if (localBg) {
        setBgImageUrl(localBg);
      }
      
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'background_image')
          .maybeSingle();
        
        if (!error && data && data.value) {
          setBgImageUrl(data.value);
          localStorage.setItem('site_background_image', data.value);
        }
      } catch (e) {
        // Table doesn't exist, use localStorage only
      }
    } catch (error) {
      console.error("Error fetching design settings:", error);
    }
  };

  const handleSaveBgImage = async () => {
    if (!bgImageUrl.trim()) {
      alert("Введите URL изображения");
      return;
    }
    
    setSavingBg(true);
    try {
      localStorage.setItem('site_background_image', bgImageUrl);
      localStorage.setItem('admin_bg_saved', 'true');
      
      // Also try to save to DB if table exists
      try {
        await supabase
          .from('site_settings')
          .upsert({ 
            key: 'background_image', 
            value: bgImageUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      } catch (dbError) {
        // Table doesn't exist, that's ok
      }
      
      alert("Фон сохранен!");
    } catch (error: any) {
      console.error("Error saving background:", error);
      alert("Ошибка сохранения");
    } finally {
      setSavingBg(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setDebugInfo(prev => prev + "\nStarting fetchData...");
    try {
      let totalCount = 0;
      let verifiedCount = 0;
      let pendingCount = 0;
      let profilesData: any[] = [];

      setDebugInfo(prev => prev + "\n1. Counting all profiles...");
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (error) {
          setDebugInfo(prev => prev + `\nCount profiles error: ${error.message}`);
        }
        totalCount = count || 0;
        setDebugInfo(prev => prev + `\nTotal profiles: ${totalCount}`);
      } catch (e: any) {
        setDebugInfo(prev => prev + `\nCount profiles exception: ${e.message}`);
      }

      setDebugInfo(prev => prev + "\n2. Counting verified profiles...");
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true);
        if (error) {
          setDebugInfo(prev => prev + `\nVerified error: ${error.message}`);
        }
        verifiedCount = count || 0;
        setDebugInfo(prev => prev + `\nVerified: ${verifiedCount}`);
      } catch (e: any) {
        setDebugInfo(prev => prev + `\nCount verified exception: ${e.message}`);
      }

      setDebugInfo(prev => prev + "\n3. Counting pending...");
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending');
        if (error) {
          setDebugInfo(prev => prev + `\nPending error: ${error.message}`);
        }
        pendingCount = count || 0;
        setDebugInfo(prev => prev + `\nPending: ${pendingCount}`);
      } catch (e: any) {
        setDebugInfo(prev => prev + `\nCount pending exception: ${e.message}`);
      }

      setDebugInfo(prev => prev + "\n4. Loading profiles list...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, role, verification_photo, verification_status, is_verified, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) {
          setDebugInfo(prev => prev + `\nSelect profiles error: ${error.message}`);
        }
        setDebugInfo(prev => prev + `\nProfiles loaded: ${data?.length || 0}`);
        profilesData = data || [];
      } catch (e: any) { 
        setDebugInfo(prev => prev + `\nSelect profiles exception: ${e.message}`);
      }

      setDebugInfo(prev => prev + "\n5. Setting state...");
      setProfiles(profilesData);
      setStats({
        totalUsers: totalCount,
        verifiedUsers: verifiedCount,
        pendingVerifications: pendingCount,
        totalMessages: 0
      });
      setDebugInfo(prev => prev + "\nDone!");
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setDebugInfo(prev => prev + `\nfetchData exception: ${error.message}`);
    } finally {
      setLoading(false);
      setDebugInfo(prev => prev + "\nLoading set to false");
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        setDebugInfo(prev => prev + `\nSupport tickets error: ${error.message}`);
        return;
      }

      if (tickets && tickets.length > 0) {
        try {
          const { data: users } = await supabase.auth.admin.listUsers();
          
          const ticketsWithUser = tickets.map(ticket => {
            const authUser = users?.users.find(u => u.id === ticket.user_id);
            return {
              ...ticket,
              user_email: authUser?.email || null,
              user_name: authUser?.user_metadata?.full_name || null
            };
          });
          
          setSupportTickets(ticketsWithUser);
        } catch (e: any) {
          setDebugInfo(prev => prev + `\nGet users error: ${e.message}`);
          setSupportTickets(tickets);
        }
      } else {
        setSupportTickets([]);
      }
    } catch (error: any) {
      console.error("Error fetching support tickets:", error);
      setDebugInfo(prev => prev + `\nSupport tickets exception: ${error.message}`);
    }
  };

  const handleReplyToTicket = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setSendingReply(true);
    try {
      await supabase
        .from('support_tickets')
        .update({
          status: 'answered',
          admin_reply: replyMessage,
          replied_at: new Date().toISOString(),
          replied_by: user?.email
        })
        .eq('id', selectedTicket.id);

      setReplyMessage("");
      setSelectedTicket(null);
      fetchSupportTickets();
      alert("Ответ отправлен!");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);
      fetchSupportTickets();
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleVerify = async (profileId: string, approved: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({ 
          is_verified: approved,
          verification_status: approved ? 'approved' : 'rejected'
        })
        .eq('id', profileId);
      
      fetchData();
    } catch (error) {
      console.error("Error updating verification:", error);
    }
  };

  const openEditModal = (profile: AdminProfile) => {
    setSelectedProfile(profile);
    setEditData({
      full_name: profile.full_name || "",
      username: profile.username || "",
      role: profile.role || "user",
      phone: profile.phone || ""
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          username: editData.username,
          role: editData.role,
        })
        .eq('id', selectedProfile.id)
        .select();
      
      if (error) {
        alert("Ошибка сохранения: " + error.message + "\nКод: " + error.code);
        console.error("Update error:", error);
        return;
      }
      
      if (data && data.length > 0) {
        alert("Сохранено! Роль: " + data[0].role);
      } else {
        alert("Сохранено (данные не вернулись)");
      }
      
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Ошибка: " + error);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.")) return;
    
    try {
      await supabase.auth.admin.deleteUser(profileId);
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const openBanModal = (profile: AdminProfile) => {
    setSelectedProfile(profile);
    setBanReason("");
    setBanModalOpen(true);
  };

  const handleBan = async () => {
    if (!selectedProfile) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: banReason,
          banned_at: new Date().toISOString()
        })
        .eq('id', selectedProfile.id);
      
      setBanModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error banning user:", error);
    }
  };

  const handleUnban = async (profileId: string) => {
    if (!confirm("Разблокировать пользователя?")) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null
        })
        .eq('id', profileId);
      
      fetchData();
    } catch (error) {
      console.error("Error unbanning user:", error);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Доступ запрещён</h2>
          <p className="text-muted-foreground mb-4">Пожалуйста, войдите в систему для доступа к админ-панели</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Войти
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-lg">
          <h2 className="text-xl font-bold mb-4 text-red-400">Ошибка доступа</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          {debugInfo && (
            <details className="text-left text-xs bg-black/30 p-3 rounded mt-4">
              <summary className="cursor-pointer mb-2">Отладочная информация</summary>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </details>
          )}
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            На главную
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-6 px-6 overflow-hidden">
      
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Панель администратора</h1>
            <p className="text-muted-foreground">Управление пользователями и верификация</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            <Shield className="w-4 h-4 mr-2" />
            Админ-доступ
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Всего пользователей</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verifiedUsers}</p>
                <p className="text-sm text-muted-foreground">Верифицировано</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
                <p className="text-sm text-muted-foreground">Ожидают верификации</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-sm text-muted-foreground">Сообщений</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="verifications">
              <Shield className="w-4 h-4 mr-2" />
              Верификации
              {stats.pendingVerifications > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {stats.pendingVerifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageCircle className="w-4 h-4 mr-2" />
              Поддержка
              {supportTickets.filter(t => t.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {supportTickets.filter(t => t.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="design">
              <Palette className="w-4 h-4 mr-2" />
              Дизайн
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <GlassCard className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Поиск по имени, email, городу..." 
                  className="glass pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className={`p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors ${profile.is_banned ? 'border border-red-500/50' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url || PlaceHolderImages[0].imageUrl} />
                          <AvatarFallback>{profile.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{profile.full_name || profile.username || "Без имени"}</span>
                            {profile.is_verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {profile.is_banned && (
                              <Badge variant="destructive">ЗАБАНЕН</Badge>
                            )}
                            <Badge variant={profile.role === 'admin' ? 'default' : 'outline'}>
                              {profile.role || 'user'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                            {profile.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {profile.email}
                              </span>
                            )}
                            {profile.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {profile.phone}
                              </span>
                            )}
                            {profile.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                          {profile.ban_reason && (
                            <div className="mt-2 text-sm text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Причина бана: {profile.ban_reason}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(profile)}>
                            Редактировать
                          </Button>
                          {profile.is_banned ? (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleUnban(profile.id)}>
                              Разбанить
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={() => openBanModal(profile)}>
                              Забанить
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(profile.id)}>
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Верификация пользователей</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setLoading(true); fetchData(); }}>
                    <Loader2 className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{profiles.filter(p => p.verification_status === 'approved').length}</p>
                  <p className="text-xs text-muted-foreground">Верифицировано</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-400">{profiles.filter(p => p.verification_status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">На проверке</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-400">{profiles.filter(p => p.verification_status === 'rejected').length}</p>
                  <p className="text-xs text-muted-foreground">Отклонено</p>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const verifiedProfiles = profiles.filter(p => p.verification_photo);
                    if (verifiedProfiles.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">Нет верификаций</p>
                          <p className="text-xs text-muted-foreground">Пользователи ещё не проходили верификацию</p>
                        </div>
                      );
                    }
                    return verifiedProfiles.map((profile) => (
                      <div 
                        key={profile.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          profile.verification_status === 'approved' ? 'bg-green-500/10 border border-green-500/30' :
                          profile.verification_status === 'rejected' ? 'bg-red-500/10 border border-red-500/30' :
                          'bg-yellow-500/10 border border-yellow-500/30'
                        }`}
                      >
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profile.verification_photo || PlaceHolderImages[0].imageUrl} />
                          <AvatarFallback>{profile.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{profile.full_name || profile.username}</span>
                            {profile.verification_status === 'approved' && (
                              <Badge className="bg-green-500/20 text-green-400">✅ Верифицирован</Badge>
                            )}
                            {profile.verification_status === 'rejected' && (
                              <Badge className="bg-red-500/20 text-red-400">❌ Отклонён</Badge>
                            )}
                            {profile.verification_status === 'pending' && (
                              <Badge className="bg-yellow-500/20 text-yellow-400">⏳ На проверке</Badge>
                            )}
                          </div>
                          {profile.verification_photo && (
                            <a 
                              href={profile.verification_photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Посмотреть фото верификации
                            </a>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Обращения в поддержку</h3>
                <Button size="sm" variant="outline" onClick={fetchSupportTickets}>
                  Обновить
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {supportTickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет обращений</p>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 bg-white/5 rounded-xl cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          <Badge 
                            variant={
                              ticket.status === 'pending' ? 'destructive' : 
                              ticket.status === 'answered' ? 'default' : 'outline'
                            }
                          >
                            {ticket.status === 'pending' ? 'Новое' : 
                             ticket.status === 'answered' ? 'Отвечено' : 'Закрыт'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(ticket.created_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  {selectedTicket ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold mb-1">{selectedTicket.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          От: {selectedTicket.user_email} ({selectedTicket.user_name || 'Без имени'})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedTicket.created_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Сообщение:</p>
                        <p className="text-sm">{selectedTicket.message}</p>
                      </div>

                      {selectedTicket.admin_reply && (
                        <div className="bg-primary/20 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Ответ администратора:</p>
                          <p className="text-sm">{selectedTicket.admin_reply}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedTicket.replied_at && new Date(selectedTicket.replied_at).toLocaleString("ru-RU")}
                          </p>
                        </div>
                      )}

                      {selectedTicket.status !== 'closed' && (
                        <div className="space-y-2">
                          <Textarea 
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Введите ответ пользователю..."
                            className="glass"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleReplyToTicket} 
                              disabled={sendingReply || !replyMessage.trim()}
                              className="flex-1"
                            >
                              {sendingReply ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              Отправить ответ
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleCloseTicket(selectedTicket.id)}
                            >
                              Закрыть
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Выберите обращение</p>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="design" className="space-y-4">
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Настройка дизайна главной страницы
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-base">Фоновое изображение</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Введите URL изображения для фона на главной странице
                  </p>
                  <div className="flex gap-3">
                    <Input 
                      value={bgImageUrl}
                      onChange={(e) => setBgImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="glass flex-1"
                    />
                    <Button 
                      onClick={handleSaveBgImage} 
                      disabled={savingBg}
                      className="neo-glow"
                    >
                      {savingBg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </>
                      )}
                    </Button>
                    {bgImageUrl && (
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          localStorage.removeItem('site_background_image');
                          setBgImageUrl('');
                          alert("Фон удалён!");
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Удалить фон
                      </Button>
                    )}
                  </div>
                </div>

                {bgImageUrl && (
                  <div>
                    <Label className="text-base mb-2 block">Предпросмотр</Label>
                    <div 
                      className="w-full h-64 rounded-xl bg-cover bg-center border border-white/20"
                      style={{ backgroundImage: `url(${bgImageUrl})` }}
                    />
                  </div>
                )}

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Рекомендации
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Используйте изображения высокого качества (1920x1080 или больше)</li>
                    <li>• Избегайте слишком светлых или тёмных изображений</li>
                    <li>• Рекомендуем использовать нейтральные или романтические темы</li>
                    <li>• Изображение будет растянуто на весь экран</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {editModalOpen && selectedProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Редактирование пользователя</h3>
              <div className="space-y-4">
                <div>
                  <Label>Имя</Label>
                  <Input 
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input 
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>Телефон</Label>
                  <Input 
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="glass"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-foreground">Роль</Label>
                  <select 
                    value={editData.role}
                    onChange={(e) => setEditData({...editData, role: e.target.value})}
                    className="glass w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Админ</option>
                    <option value="moderator">Модератор</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {banModalOpen && selectedProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Бан пользователя</h3>
              <p className="mb-4 text-muted-foreground">
                Пользователь: {selectedProfile.full_name || selectedProfile.username}
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Причина бана</Label>
                  <Textarea 
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Укажите причину бана..."
                    className="glass"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleBan} variant="destructive" className="flex-1">
                    Забанить
                  </Button>
                  <Button variant="outline" onClick={() => setBanModalOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
      
      {debugInfo && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
            Отладочная информация (для разработчика)
          </summary>
          <pre className="text-xs bg-black/50 p-4 rounded whitespace-pre-wrap text-muted-foreground">
            {debugInfo}
          </pre>
        </details>
      )}
    </div>
  );
}
