"use client";

import { GlassCard } from "@/components/GlassCard";
import { Smartphone, Apple, Chrome, Globe } from "lucide-react";
import Link from "next/link";

export default function InstallPage() {
  return (
    <div className="min-h-screen pt-20 pb-6 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-3">
            <Smartphone className="w-8 h-8" />
            Установить приложение
          </h1>
          <p className="text-muted-foreground mt-2">
            Добавьте Lavmee на главный экран телефона
          </p>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Chrome className="w-5 h-5" />
            Android (Chrome, Samsung, Яндекс)
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Откройте сайт <strong>lavmee.ru</strong></li>
            <li>Нажмите три точки в браузере</li>
            <li>Выберите <strong>"Добавить на главный экран"</strong></li>
            <li>Нажмите <strong>"Установить"</strong></li>
            <li>Приложение появится на экране телефона</li>
          </ol>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Apple className="w-5 h-5" />
            iPhone (Safari)
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Откройте сайт <strong>lavmee.ru</strong> в Safari</li>
            <li>Нажмите кнопку <strong>"Поделиться"</strong></li>
            <li>Прокрутите вниз и выберите <strong>"На экран Домой"</strong></li>
            <li>Нажмите <strong>"Добавить"</strong></li>
            <li>Приложение появится на рабочем столе</li>
          </ol>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Не работает сайт?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Если <strong>lavmee.ru</strong> не открывается, используйте резервный адрес:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-primary">https://futuredate1.vercel.app</code>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Иногда может потребоваться VPN для доступа к сайту.
          </p>
        </GlassCard>

        <div className="text-center">
          <Link href="/" className="text-primary hover:underline">
            Вернуться на главную →
          </Link>
        </div>
      </div>
    </div>
  );
}