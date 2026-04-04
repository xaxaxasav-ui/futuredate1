import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import { GlassCard } from "@/components/GlassCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: 'Политика использования cookies | Свидание будущего AI',
  description: 'Политика использования cookies и аналогичных технологий',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold font-headline text-center">Политика использования cookies</h1>
        <GlassCard className="p-8">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-medium">Дата публикации: 26 марта 2026 года</p>
              
              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">1. Что такое cookies</h2>
                <p>1.1. Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при использовании веб-сайтов и приложений.</p>
                <p>1.2. Cookies выполняют важные функции: запоминают ваши настройки, улучшают пользовательский опыт, обеспечивают безопасность.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">2. Какие cookies мы используем</h2>
                
                <h3 className="font-medium text-foreground mt-4">2.1. Необходимые cookies</h3>
                <p>Эти cookies необходимы для работы Сервиса:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Аутентификация — для входа в аккаунт</li>
                  <li>Настройки безопасности — для защиты от несанкционированного доступа</li>
                  <li>Предпочтения — для сохранения ваших настроек</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">2.2. Функциональные cookies</h3>
                <p>Эти cookies помогают улучшить работу Сервиса:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Аналитика — для понимания, как используется Сервис</li>
                  <li>Персонализация — для подбора релевантного контента</li>
                  <li>Уведомления — для отправки важных оповещений</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">2.3. Рекламные cookies</h3>
                <p>Мы не используем сторонние рекламные cookies. При необходимости они будут использоваться только с вашего согласия.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">3. Управление cookies</h2>
                <p>3.1. Вы можете управлять cookies через настройки браузера:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Полностью отключить cookies</li>
                  <li>Удалить существующие cookies</li>
                  <li>Настроить уведомления о новых cookies</li>
                </ul>
                <p className="mt-2">3.2. Обратите внимание: отключение некоторых cookies может ограничить функциональность Сервиса.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">4. Срок хранения</h2>
                <p>4.1. Сессионные cookies удаляются после закрытия браузера.</p>
                <p>4.2. Постоянные cookies хранятся от 30 дней до 2 лет (в зависимости от типа).</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">5. Аналогичные технологии</h2>
                <p>Помимо cookies, мы можем использовать:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Local Storage — для хранения данных в браузере</li>
                  <li>Web Beacons — для сбора анонимной статистики</li>
                  <li>Session Storage — для временного хранения данных</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">6. Изменения</h2>
                <p>6.1. Мы можем обновлять настоящую Политику.</p>
                <p>6.2. Изменения вступают в силу с момента публикации на сайте.</p>
              </section>
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
    </div>
  );
}
