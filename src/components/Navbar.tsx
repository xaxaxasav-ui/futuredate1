"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, User, Sparkles, LogOut, Sun, Moon, Navigation, Shield, HelpCircle, Bell, Menu, Star, Clock, FileText, Settings, Home } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getUnreadCount } from "@/lib/notifications";

const ADMIN_EMAILS = [
  "admin@date-future.ru",
  "admin@свидание-будущего.рф",
  "statnihx@mail.ru"
];

const MAIN_TABS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/dashboard", label: "Найти", icon: Heart },
  { href: "/nearby", label: "Рядом", icon: Navigation },
  { href: "/messages", label: "Сообщения", icon: MessageSquare },
];

const MORE_TABS = [
  { href: "/notifications", label: "Уведомления", icon: Bell, badge: true },
  { href: "/favorites", label: "Избранное", icon: Star },
  { href: "/history", label: "История", icon: Clock },
  { href: "/assessment", label: "ИИ Лаборатория", icon: Sparkles },
  { href: "/support", label: "Поддержка", icon: HelpCircle },
  { href: "/verification", label: "Верификация", icon: FileText },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useSupabase();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(count => setUnreadCount(count));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const goTo = (href: string) => {
    window.location.href = href;
  };

  return (
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'bg-primary/20 text-primary' 
                      : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/settings"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/settings' ? 'text-primary' : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <Settings className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Настройки</span>
              </Link>
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
                  <button onClick={() => goTo('/notifications')} className={`relative p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </button>
                  <button onClick={() => goTo('/profile')} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
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

      <div className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md border-t z-[65] px-1 py-2 ${theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}`}>
        <div className="flex items-center justify-between overflow-x-auto">
          {MAIN_TABS.map((item) => (
            <button
              key={item.href}
              onClick={() => goTo(item.href)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs min-w-[60px] ${
                pathname === item.href 
                  ? 'text-primary' 
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
          {MORE_TABS.slice(0, 4).map((item) => (
            <button
              key={item.href}
              onClick={() => goTo(item.href)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs min-w-[60px] ${
                pathname === item.href 
                  ? 'text-primary' 
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {item.badge && unreadCount > 0 && (
                <Badge variant="destructive" className="absolute top-0 right-0 h-3 w-3 p-0 text-[8px]">
                </Badge>
              )}
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => goTo('/settings')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs min-w-[60px] ${
              pathname === '/settings' 
                ? 'text-primary' 
                : theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            <Settings className={`w-5 h-5 ${pathname === '/settings' ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className="text-[10px]">Ещё</span>
          </button>
        </div>
      </div>
    </nav>
  );
}