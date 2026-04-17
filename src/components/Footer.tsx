"use client";

import Link from "next/link";
import { Shield, Heart, Mail, FileText, Scale, AlertTriangle, Lock, Globe, Copyright } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold font-headline">Lavmee</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Знакомства нового поколения с ИИ-оценкой личности и виртуальными свиданиями.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Навигация</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Главная</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Найти пару</Link></li>
              <li><Link href="/assessment" className="hover:text-primary transition-colors">ИИ Анализ</Link></li>
              <li><Link href="/support" className="hover:text-primary transition-colors">Поддержка</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Правовая информация</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/terms" className="hover:text-primary transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Правила сервиса
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/legal/offer" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Scale className="w-4 h-4" /> Публичная оферта
                </Link>
              </li>
              <li>
                <Link href="/legal/consent" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Согласие на обработку персональных данных
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Для правообладателей</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/copyright" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Copyright className="w-4 h-4" /> Политика в отношении авторских прав
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Политика использования cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="w-4 h-4 text-primary" />
              <span>© {new Date().getFullYear()} Lavmee. Все права защищены.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ООО &quot;Свидание будущего&quot;</span>
            </div>
          </div>
          <div className="text-center mt-4 text-xs text-muted-foreground">
            Сервис работает на территории Российской Федерации в соответствии с Федеральным законом № 152-ФЗ &quot;О персональных данных&quot; 
            и Федеральным законом № 230-ФЗ &quot;О защите прав потребителей&quot;
          </div>
        </div>
      </div>
    </footer>
  );
}
