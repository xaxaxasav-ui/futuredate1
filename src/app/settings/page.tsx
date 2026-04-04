"use client";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, Moon, Sun, Bell, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          router.push("/auth");
        }
      } catch (e) {
        router.push("/auth");
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, [router]);

  const handleDeleteAccount = async () => {
    if (!confirm("Вы уверены, что хотите удалить аккаунт? Это действие необратимо.") || !user) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Ошибка при удалении аккаунта");
    } finally {
      setDeleting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-6 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-3">
            <Settings className="w-8 h-8" />
            Настройки
          </h1>
          <p className="text-muted-foreground">Управление приложением</p>
        </div>

        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>Тёмная тема</span>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="rounded-full">
              {theme === 'dark' ? 'Светлая' : 'Тёмная'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Уведомления</span>
            </div>
            <Button variant="outline" className="rounded-full" onClick={() => router.push('/profile')}>
              Настроить
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Конфиденциальность</span>
            </div>
            <Button variant="outline" className="rounded-full" onClick={() => router.push('/legal/privacy')}>
              Управление
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 mt-6">
          <h2 className="text-lg font-bold mb-4">Опасная зона</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Удаление аккаунта приведёт к потере всех ваших данных, включая профиль, сообщения и匹配и.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-full"
          >
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Удалить аккаунт
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
