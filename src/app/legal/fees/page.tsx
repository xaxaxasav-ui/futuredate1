import { Metadata } from 'next';

import { GlassCard } from "@/components/GlassCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: 'Политика оплаты и возврата средств | Свидание будущего AI',
  description: 'Политика оплаты подписки и возврата средств',
};

export default function FeesPage() {
  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6">
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold font-headline text-center">Политика оплаты и возврата средств</h1>
        <GlassCard className="p-8">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-medium">Дата публикации: 26 марта 2026 года</p>
              
              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">1. Общие положения</h2>
                <p>1.1. Настоящая Политика регулирует отношения между Пользователем и сервисом знакомств «Свидание будущего AI» (далее — Сервис) в части оплаты услуг и возврата денежных средств.</p>
                <p>1.2. Политика разработана в соответствии с Законом РФ от 07.02.1992 № 2300-1 «О защите прав потребителей» и Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">2. Тарифы и оплата</h2>
                
                <h3 className="font-medium text-foreground mt-4">2.1. Доступные тарифы</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Бесплатный</strong> — базовые функции знакомств</li>
                  <li><strong>Премиум</strong> — расширенные возможности (точная цена указана в приложении)</li>
                  <li><strong>VIP</strong> — полный доступ ко всем функциям (точная цена указана в приложении)</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">2.2. Способы оплаты</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Банковские карты (Visa, MasterCard, МИР)</li>
                  <li>Электронные кошельки (ЮMoney, Qiwi)</li>
                  <li>Мобильные платежи</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">2.3. Автоматическое продление</h3>
                <p>Подписка продлевается автоматически. Вы можете отключить автопродление в любой момент в настройках аккаунта.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">3. Политика возврата средств</h2>
                
                <h3 className="font-medium text-foreground mt-4">3.1. Условия возврата</h3>
                <p>Вы можете вернуть средства в следующих случаях:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Техническая невозможность использования услуг по вине Сервиса</li>
                  <li>Списание средств без вашего согласия</li>
                  <li>Значительное несоответствие услуг описанию</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">3.2. Сроки возврата</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>При оплате картой — до 30 рабочих дней</li>
                  <li>При оплате электронными деньгами — до 10 рабочих дней</li>
                  <li>При оплате мобильным платежом — до 45 рабочих дней</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">3.3. Основания для отказа в возврате</h3>
                <p>Средства не возвращаются в случаях:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Нарушение Правил сервиса Пользователем</li>
                  <li>Использование услуг после истечения срока подписки</li>
                  <li>Самостоятельное удаление аккаунта Пользователем</li>
                  <li>Технические проблемы на стороне Пользователя (плохое интернет-соединение)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">4. Как оформить возврат</h2>
                <p>4.1. Для оформления возврата:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Напишите на email: billing@svidanie.future</li>
                  <li>Укажите: номер заказа, дату платежа, причину возврата</li>
                  <li>Приложите скриншоты или чеки</li>
                </ul>
                <p className="mt-2">4.2. Заявка рассматривается в течение 3 рабочих дней.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">5. Дисконтные предложения</h2>
                <p>5.1. Сервис может предоставлять скидки и промокоды.</p>
                <p>5.2. Скидки и промокоды не подлежат возврату в денежном эквиваленте.</p>
                <p>5.3. При использовании промокода возврат осуществляется по полной стоимости без учёта скидки.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">6. Ограничение ответственности</h2>
                <p>6.1. Сервис не несёт ответственности за действия платёжных систем и банков.</p>
                <p>6.2. При возникновении спорных ситуаций решение принимается индивидуально.</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground mb-2">7. Контакты</h2>
                <p>По вопросам оплаты и возврата: billing@svidanie.future</p>
              </section>
            </div>
          </ScrollArea>
        </GlassCard>
      </div>
    </div>
  );
}
