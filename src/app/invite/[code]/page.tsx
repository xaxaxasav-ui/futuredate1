"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  const [loading, setLoading] = useState(true);
  const [invitedUser, setInvitedUser] = useState<{ username: string; full_name: string } | null>(null);

  useEffect(() => {
    async function checkInvite() {
      if (!code) {
        router.push("/auth");
        return;
      }

      try {
        // Check if it's a username
        const { data: userData } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('username', code)
          .single();

        if (userData) {
          setInvitedUser(userData);
        } else {
          // Check if it's a user ID prefix
          const { data: usersById } = await supabase
            .from('profiles')
            .select('username, full_name')
            .ilike('id', `${code}%`)
            .limit(1);

          if (usersById && usersById.length > 0) {
            setInvitedUser(usersById[0]);
          }
        }
      } catch (e) {
        console.error("Error checking invite:", e);
      } finally {
        setLoading(false);
      }
    }

    checkInvite();
  }, [code, router]);

  if (loading) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
          <Heart className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold font-headline">
          {invitedUser ? `Вас пригласил(а) ${invitedUser.full_name || invitedUser.username}!` : 'Приглашение в Свидание будущего AI'}
        </h1>

        <p className="text-muted-foreground">
          Присоединяйтесь к знакомствам нового поколения с ИИ-оценкой личности и виртуальными свиданиями!
        </p>

        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-medium">Бонусы для новых пользователей:</span>
            </div>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li>✨ 3 дня Премиум бесплатно</li>
              <li>💕 10 бесплатных лайков</li>
              <li>🎯 Приоритет в ленте рекомендаций</li>
            </ul>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <Link href="/auth?tab=signup" className="block">
            <Button className="w-full rounded-full neo-glow" size="lg">
              Присоединиться
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full rounded-full">
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
