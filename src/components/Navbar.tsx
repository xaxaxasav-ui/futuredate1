"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, User, Sparkles, LogOut, Sun, Moon, Navigation, Shield, HelpCircle, Bell, Menu, ChevronDown, MoreHorizontal, Star, Clock, FileText, Settings, Home, Download, Phone, PhoneIncoming } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getUnreadCount, getUnreadMessagesCount } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "admin@date-future.ru",
  "admin@свидание-будущего.рф",
  "statnihx@mail.ru"
];

const MAIN_TABS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/dashboard", label: "Найти", icon: Heart },
  { href: "/nearby", label: "Рядом", icon: Navigation },
  { href: "/messages", label: "Сообщения", icon: MessageSquare, badge: true },
];

const MORE_MENU = [
  { href: "/notifications", label: "Уведомления", icon: Bell, badge: true },
  { href: "/favorites", label: "Избранное", icon: Star },
  { href: "/history", label: "История", icon: Clock },
  { href: "/assessment", label: "ИИ Лаборатория", icon: Sparkles },
  { href: "/support", label: "Поддержка", icon: HelpCircle },
  { href: "/verification", label: "Верификация", icon: FileText },
  { href: "/install", label: "Установить", icon: Download },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useSupabase();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callerData, setCallerData] = useState<any>(null);
  const [debugStatus, setDebugStatus] = useState<string>('');
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const showPushNotification = async (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/images/favicon.svg',
        tag: 'incoming-call',
        renotify: true,
        requireInteraction: true
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/images/favicon.svg',
          tag: 'incoming-call',
          renotify: true,
          requireInteraction: true
        });
      }
    }
  };

  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() => {});
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered:', registration);
      }).catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(count => setUnreadCount(count));
      getUnreadMessagesCount(user.id).then(count => setUnreadMessagesCount(count));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    console.log('Navbar: checking for calls, user:', user.id);
    
    const checkIncomingCalls = async () => {
      try {
        setDebugStatus('🔍 Проверка звонков...');
        console.log('🔍 Polling: checking for calls for user:', user.id);
        const { data, error } = await supabase
          .from('calls')
          .select('id, caller_id, receiver_id, status, created_at')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
        
        console.log('📊 Polling result:', { data, error, count: data?.length });
        console.log('📊 Raw data:', JSON.stringify(data));
        
        if (data && data.length > 0 && !incomingCall) {
          console.log('📲 Polling: incoming call found!', data[0]);
          setDebugStatus('📲 Звонок найден!');
          setIncomingCall(data[0]);
          playRingtone();
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', data[0].caller_id)
            .single();
          console.log('👤 Caller profile:', profile);
          setCallerData(profile);
          
          const callerName = profile?.full_name || 'Пользователь';
          setDebugStatus('✅ Показываю уведомление');
          showPushNotification('📞 Входящий звонок!', `${callerName} звонит вам`);
        } else if (data && data.length > 0 && incomingCall) {
          console.log('⏭️ Polling: call exists but incomingCall already set, skipping');
          setDebugStatus('⏭️ Уведомление уже показано');
        } else {
          console.log('⏭️ Polling: no pending calls');
          setDebugStatus('⏭️ Нет входящих звонков');
        }
      } catch (e) {
        console.error('❌ Error checking calls:', e);
        setDebugStatus('❌ Ошибка: ' + (e as Error).message);
      }
    };
    
    checkIncomingCalls();
    const interval = setInterval(checkIncomingCalls, 1500);
    
    const channel = supabase.channel('calls-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Realtime incoming call received:', payload);
        console.log('Payload new:', payload.new);
        console.log('Payload new status:', payload.new?.status);
        if (payload.new && payload.new.status === 'pending') {
          console.log('✅ Setting incoming call from realtime');
          setDebugStatus('🔔 Получено через realtime!');
          setIncomingCall(payload.new);
          playRingtone();
          supabase.from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.caller_id)
            .single()
            .then(({ data }) => {
              console.log('Caller profile loaded:', data);
              setCallerData(data);
              const callerName = data?.full_name || 'Пользователь';
              showPushNotification('📞 Входящий звонок!', `${callerName} звонит вам`);
            });
        }
      })
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    await supabase
      .from('calls')
      .update({ status: 'accepted' })
      .eq('id', incomingCall.id);
    router.push(`/date?user=${incomingCall.caller_id}&call=${incomingCall.id}`);
    setIncomingCall(null);
    setCallerData(null);
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    await supabase
      .from('calls')
      .update({ status: 'declined' })
      .eq('id', incomingCall.id);
    setIncomingCall(null);
    setCallerData(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const navigate = (href: string) => {
    window.location.href = href;
  };

  return (
    <>
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        display: incomingCall ? 'flex' : 'none', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          padding: 32, 
          borderRadius: 16, 
          backgroundColor: '#1a1a1a', 
          border: '1px solid #333', 
          textAlign: 'center',
          color: 'white'
        }}>
          {debugStatus && (
            <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 12 }}>{debugStatus}</div>
          )}
          <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
          <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Входящий звонок!</h3>
          {callerData?.avatar_url && (
            <img src={callerData.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px' }} />
          )}
          <p style={{ color: '#888', marginBottom: 16 }}>
            {callerData?.full_name || 'Пользователь'} звонит вам
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button 
              onClick={declineCall}
              style={{ padding: '8px 16px', borderRadius: 20, backgroundColor: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Отклонить
            </button>
            <button 
              onClick={acceptCall}
              style={{ padding: '8px 16px', borderRadius: 20, backgroundColor: '#16a34a', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Принять
            </button>
          </div>
        </div>
      </div>

      {incomingCall && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="p-8 rounded-2xl bg-black/90 border border-white/20 text-center">
            {debugStatus && (
              <div className="text-xs text-yellow-400 mb-2">{debugStatus}</div>
            )}
            {callerData?.avatar_url && (
              <img src={callerData.avatar_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
            )}
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <PhoneIncoming className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Входящий звонок!</h3>
            <p className="text-gray-400 text-sm mb-4">
              {callerData?.full_name || 'Пользователь'} звонит вам
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={declineCall}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm"
              >
                Отклонить
              </button>
              <button 
                onClick={acceptCall}
                className="px-4 py-2 rounded-full bg-green-600 text-white text-sm"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-50">
      <div className={`backdrop-blur-md border-b ${theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" />
              <span className="font-headline font-bold text-lg hidden sm:inline">Свидание AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {MAIN_TABS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    pathname === item.href 
                      ? 'bg-primary/20 text-primary' 
                      : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  {item.label}
                  {item.href === '/messages' && unreadMessagesCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Badge>
                  )}
                </Link>
              ))}
              
              <div className="relative">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    MORE_MENU.some(n => pathname === n.href) ? 'text-primary' : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                  onClick={() => setMoreOpen(!moreOpen)}
                >
                  <MoreHorizontal className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Ещё</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                </button>
                
                {moreOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-60 rounded-xl border overflow-hidden shadow-xl z-[100] ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}>
                    <div className="py-2">
                      {MORE_MENU.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => { setMoreOpen(false); navigate(item.href); }}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors w-full ${
                            theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                          )}
                        </button>
                      ))}
                      {isAdmin && (
                        <button
                          onClick={() => { setMoreOpen(false); navigate('/admin'); }}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-yellow-500 w-full ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                          Админ-панель
                        </button>
                      )}
                      <button
                        onClick={() => { handleSignOut(); setMoreOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-500 w-full text-left ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme} 
                className="rounded-full"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-gray-900" />}
              </Button>
              
              {user ? (
                <>
                  <button onClick={() => navigate('/notifications')} className={`relative p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </button>
                  <button onClick={() => navigate('/profile')} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                    <User className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">Войти</Button>
                  </Link>
                  <Link href="/auth?tab=signup">
                    <Button size="sm" className="rounded-full neo-glow">Присоединиться</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0">
        <div className={`flex items-center justify-around backdrop-blur-md border-t px-2 py-3 ${theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}`}>
          {MAIN_TABS.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs relative ${
                pathname === item.href 
                  ? 'text-primary' 
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                {item.href === '/messages' && unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[8px]">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs ${
              moreOpen ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            <Menu className={`w-5 h-5 ${moreOpen ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className="text-[10px]">Ещё</span>
          </button>
        </div>

        {moreOpen && (
          <div className={`absolute bottom-full left-0 right-0 mb-0 rounded-t-xl border-b overflow-hidden shadow-xl ${
            theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10'
          }`}>
            <div className="py-3 px-2 grid grid-cols-2 gap-2">
              {MORE_MENU.map((item) => (
                <button
                  key={item.href}
                  onClick={() => { setMoreOpen(false); navigate(item.href); }}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg ${
                    theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => { setMoreOpen(false); navigate('/admin'); }}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg text-yellow-500 ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Админ-панель</span>
                </button>
              )}
              <button
                onClick={() => { handleSignOut(); setMoreOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg text-red-500 ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}