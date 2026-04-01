"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { Sparkles, Heart, Shield, Cpu, ArrowRight } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-futuristic");
  const [bgImage, setBgImage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedBg = localStorage.getItem('site_background_image');
    if (savedBg) {
      setBgImage(savedBg);
    }

    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
      }
    }
    checkUser();
  }, []);

  return (
    <div className="relative min-h-screen">
      {bgImage && (
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-black/80" />
          <img src={bgImage} alt="background" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative z-10 bg-background/95 min-h-screen">
      
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3 h-3" /> На базе современных технологий
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] text-glow font-headline">
              Знакомства <br />
              <span className="text-primary">будущего.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              Больше, чем просто свайпы. Соединяйтесь через ИИ-анализ личности и иммерсивные виртуальные свидания. Ваша судьба — на расстоянии вектора.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=signup">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg neo-glow">
                  Начать путь <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/assessment">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg glass">
                  Пройти ИИ-тест
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30" />
            <GlassCard className="p-2 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="rounded-xl overflow-hidden">
                <img 
                  src="/images/photo.jpg" 
                  alt="Красивая девушка" 
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </GlassCard>
            <div className="absolute -bottom-6 -left-6 glass p-4 rounded-2xl animate-bounce-slow max-w-[240px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg shadow-lg">
                  💕
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      {isLoggedIn ? 'Ваша пара найдена!' : 'Пара найдена'}
                    </span>
                  </div>
                  <p className="text-xs font-medium">
                    {isLoggedIn ? 'ИИ нашёл для вас идеальное совпадение' : 'Света на 98% совместима'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isLoggedIn ? 'Нажмите, чтобы увидеть кто это' : 'с вашей сигнатурой личности.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">Технологии для искренней связи</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Традиционные знакомства устарели. Мы используем передовые технологии для создания настоящих человеческих отношений.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="p-8 space-y-4 group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Динамический ИИ-анализ</h3>
              <p className="text-muted-foreground">Пообщайтесь с ИИ-психологом, чтобы раскрыть свои глубинные черты. Больше никаких скучных анкет.</p>
            </GlassCard>

            <GlassCard className="p-8 space-y-4 group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Векторное сопоставление</h3>
              <p className="text-muted-foreground">Алгоритмы pgvector находят партнеров на основе поведенческого выравнивания и резонанса личностей.</p>
            </GlassCard>

            <GlassCard className="p-8 space-y-4 group hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Безопасная экосистема</h3>
              <p className="text-muted-foreground">Модерация ИИ в реальном времени защищает ваш покой, фильтруя контент и обеспечивая верификацию.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto glass p-12 rounded-[3rem] text-center space-y-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 blur-3xl rounded-full" />
          <h2 className="text-4xl md:text-6xl font-bold font-headline relative z-10">Готовы встретить <br /> свое будущее?</h2>
          <p className="text-lg text-muted-foreground relative z-10">Присоединяйтесь к 500,000+ первопроходцев, исследующих интимность нового поколения.</p>
          <div className="flex justify-center relative z-10">
            <Link href="/auth?tab=signup">
              <Button size="lg" className="rounded-full h-14 px-12 text-lg neo-glow">
                Создать профиль
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-headline font-bold text-lg tracking-tighter">Свидание будущего AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Свидание будущего. Создано для эпохи искусственной близости.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-primary">Конфиденциальность</Link>
            <Link href="/legal/terms" className="hover:text-primary">Условия</Link>
            <Link href="/legal/consent" className="hover:text-primary">Безопасность</Link>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
