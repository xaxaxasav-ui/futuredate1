"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, User, Sparkles, LogOut, Sun, Moon, Navigation, Shield, HelpCircle, Bell, Menu, ChevronDown, MoreHorizontal, Star, Clock, FileText, Settings, Home } from "lucide-react";
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

const MORE_MENU = [
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(count => setUnreadCount(count));
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

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
              
              <div className="relative" ref={moreRef}>
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
                  <div className={`absolute top-full right-0 mt-2 w-60 rounded-xl border overflow-hidden shadow-xl z-50 ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}>
                    <div className="py-2">
                      {MORE_MENU.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                            theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                          onClick={() => setMoreOpen(false)}
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
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-yellow-500 ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setMoreOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Админ-панель
                        </Link>
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
                  <Link href="/notifications" className={`relative p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Link>
                  <Link href="/profile" className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                    <User className="w-5 h-5" />
                  </Link>
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

      <div className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md border-t z-[60] px-2 py-2 ${theme === 'dark' ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'}`}>
        <div className="flex items-center justify-around">
          {MAIN_TABS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs ${
                pathname === item.href 
                  ? 'text-primary' 
                  : theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              {item.label}
            </Link>
          ))}
          <button 
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs ${
              MORE_MENU.some(n => pathname === n.href) ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
            onClick={() => setMoreOpen(!moreOpen)}
            type="button"
          >
            <Menu className={`w-6 h-6 ${MORE_MENU.some(n => pathname === n.href) ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className={MORE_MENU.some(n => pathname === n.href) ? 'text-primary' : theme === 'dark' ? 'text-white' : 'text-gray-900'}>Ещё</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
