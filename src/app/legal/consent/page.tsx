import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import { GlassCard } from "@/components/GlassCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: 'Согласие на обработку данных | Свидание будущего AI',
  description: 'Согласие на обработку персональных данных согласно ФЗ №152-ФЗ',
};

export default function ConsentPage() {
  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold font-headline text-center">Согласие на обработку персональных данных</h1>
        <GlassCard className="p-8">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">При регистрации в сервисе «Свидание будущего AI» Пользователь даёт согласие на обработку персональных данных на условиях, изложенных ниже.</p>
              
              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">1. Субъект персональных данных</h2>
                <p>Субъектом персональных данных является дееспособное физическое лицо, достигшее 18 лет, зарегистрировавшееся в Сервисе.</p>
              </section>
               
              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">2. Перечень персональных данных</h2>
                <p>Пользователь даёт согласие на обработку следующих персональных данных:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Фамилия, имя (или псевдоним)</li>
                  <li>Адрес электронной почты</li>
                  <li>Номер мобильного телефона</li>
                  <li>Фотографии профиля</li>
                  <li>Биография и информация о себе</li>
                  <li>Результаты ИИ-тестирования личности</li>
                  <li>Данные о предпочтениях и интересах</li>
                  <li>Данные об активности в Сервисе</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">3. Цели обработки</h2>
                <p>Персональные данные обрабатываются в целях:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Предоставления услуг Сервиса</li>
                  <li>Идентификации Пользователя</li>
                  <li>ИИ-анализа личности и подбора партнёров</li>
                  <li>Коммуникации с Пользователем</li>
                  <li>Обеспечения безопасности</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">4. Действия с персональными данными</h2>
                <p>В рамках настоящего согласия осуществляются следующие действия с персональными данными:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Сбор, запись, систематизация, накопление</li>
                  <li>Хранение, уточнение (обновление, изменение)</li>
                  <li>Извлечение, использование</li>
                  <li>Передача (предоставление, доступ)</li>
                  <li>Обезличивание, блокирование</li>
                  <li>Удаление, уничтожение</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">5. Способы обработки</h2>
                <p>Обработка персональных данных осуществляется с использованием автоматизированных и неавтоматизированных средств обработки.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">6. Срок действия согласия</h2>
                <p>6.1. Настоящее согласие действует с момента регистрации в Сервисе.</p>
                <p>6.2. Согласие действует до момента его отзыва Пользователем.</p>
                <p>6.3. После удаления аккаунта персональные данные хранятся в течение сроков, установленных законодательством РФ.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">7. Отзыв согласия</h2>
                <p>7.1. Пользователь вправе отозвать согласие на обработку персональных данных в любое время.</p>
                <p>7.2. Для отзыва согласия необходимо:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Направить письменное заявление на email: privacy@svidanie.future</li>
                  <li>Или удалить аккаунт через настройки профиля</li>
                </ul>
                <p>7.3. При отзыве согласия Оператор вправе продолжить обработку данных при наличии оснований, предусмотренных законодательством.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">8. Ограничение ответственности</h2>
                <p>Пользователь несёт ответственность за достоверность предоставленных персональных данных.</p>
              </section>

              <p className="pt-4 text-foreground font-medium">Настоящее согласие дано в соответствии с Федеральным законом от 27.07.2006 №152-ФЗ «О персональных данных».</p>
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
    </div>
  );
}
