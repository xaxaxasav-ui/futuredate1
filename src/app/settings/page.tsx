"use client";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, Moon, Sun, Bell, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/components/SupabaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useSupabase();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setShowContent(true);
    }
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  const handleDeleteAccount = async () => {
    if (!confirm("Вы уверены, что хотите удалить аккаунт? Это действие необратимо.")) return;
    
    setDeleting(true);
    try {
      if (user) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) throw error;
        await signOut();
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Ошибка при удалении аккаунта");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading && !showContent) {
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

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold mb-4">Внешний вид</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
              </div>
              <Button variant="outline" onClick={toggleTheme}>
                Переключить
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold mb-4">Уведомления</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span>Push-уведомления</span>
              </div>
              <Button variant="outline" disabled>
                Скоро
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-bold mb-4">Конфиденциальность</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <span>Приватный профиль</span>
                </div>
                <Button variant="outline" disabled>
                  Скоро
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-red-500/30">
            <h2 className="text-lg font-bold mb-4 text-red-400">Опасная зона</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>Удалить аккаунт</span>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Удалить
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
