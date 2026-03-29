"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageSquare, User, Sparkles, LogOut, Sun, Moon, 
  Navigation, Shield, HelpCircle, Bell, Menu, X, 
  Home, Settings, Star, Clock, Users, MessageCircle, FileText
} from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getUnreadCount } from "@/lib/notifications";

const ADMIN_EMAILS = [
  "admin@date-future.ru",
  "admin@свидание-будущего.рф",
  "statnihx@mail.ru"
];

const MAIN_NAV = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/dashboard", label: "Найти", icon: Heart },
  { href: "/nearby", label: "Рядом", icon: Navigation },
];

const USER_NAV = [
  { href: "/messages", label: "Сообщения", icon: MessageSquare },
  { href: "/notifications", label: "Уведомления", icon: Bell, badge: true },
  { href: "/favorites", label: "Избранное", icon: Star },
  { href: "/history", label: "История", icon: Clock },
];

const SERVICE_NAV = [
  { href: "/assessment", label: "ИИ Лаборатория", icon: Sparkles },
  { href: "/support", label: "Поддержка", icon: HelpCircle },
  { href: "/verification", label: "Верификация", icon: FileText },
];

const ACCOUNT_NAV = [
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useSupabase();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(count => setUnreadCount(count));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setSidebarOpen(false);
  };

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const NavSection = ({ title, items }: { title?: string, items: typeof MAIN_NAV }) => (
    <div className="mb-6">
      {title && <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">{title}</h3>}
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href 
                ? 'bg-primary/20 text-primary' 
                : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              {item.label}
            </div>
            {item.badge && unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-full glass"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-72 glass border-r border-white/10 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
              <Sparkles className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform" />
              <span className="font-headline font-bold text-lg">Свидание AI</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <NavSection items={MAIN_NAV} />
            
            {user && (
              <>
                <NavSection title="ЛИЧНОЕ" items={USER_NAV} />
                <NavSection title="СЕРВИСЫ" items={SERVICE_NAV} />
                <NavSection title="АККАУНТ" items={ACCOUNT_NAV} />
                
                {isAdmin && (
                  <NavSection 
                    items={[{ href: "/admin", label: "Админ-панель", icon: Shield }]} 
                  />
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-white/10 space-y-2">
            <Button 
              variant="ghost" 
              onClick={toggleTheme} 
              className="w-full justify-start rounded-lg"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </Button>
            
            {user ? (
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full justify-start rounded-lg text-red-400 hover:text-red-300"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Выйти
              </Button>
            ) : (
              <div className="space-y-2">
                <Link href="/auth" onClick={() => setSidebarOpen(false)}>
                  <Button variant="outline" className="w-full rounded-lg">
                    Войти
                  </Button>
                </Link>
                <Link href="/auth?tab=signup" onClick={() => setSidebarOpen(false)}>
                  <Button className="w-full rounded-lg neo-glow">
                    Присоединиться
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="md:pl-20" />
    </>
  );
}
