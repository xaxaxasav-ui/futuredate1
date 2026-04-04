"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";

interface Question {
  id: number;
  question: string;
  options: { id: string; text: string }[];
}

const QUESTIONS: Question[] = [
  { id: 1, question: "Как ты предпочитаешь проводить свободное время?", options: [{ id: "a", text: "Спорт и активный отдых" }, { id: "b", text: "Чтение, фильмы" }, { id: "c", text: "Встречи с друзьями" }, { id: "d", text: "Работа, саморазвитие" }, { id: "e", text: "Путешествия" }] },
  { id: 2, question: "Какой ты в отношениях?", options: [{ id: "a", text: "Романтичный" }, { id: "b", text: "Практичный" }, { id: "c", text: "Эмоциональный" }, { id: "d", text: "Сдержанный" }, { id: "e", text: "Авантюрный" }] },
  { id: 3, question: "Главное в партнере?", options: [{ id: "a", text: "Юмор" }, { id: "b", text: "Ум" }, { id: "c", text: "Честность" }, { id: "d", text: "Внешность" }, { id: "e", text: "Общие интересы" }] },
  { id: 4, question: "Отношение к онлайн-знакомствам?", options: [{ id: "a", text: "Положительное" }, { id: "b", text: "Нейтральное" }, { id: "c", text: "Предпочитаю традиционные" }, { id: "d", text: "Скептически" }, { id: "e", text: "Есть успешный опыт" }] },
  { id: 5, question: "Идеальное первое свидание?", options: [{ id: "a", text: "Ужин в ресторане" }, { id: "b", text: "Прогулка, кофе" }, { id: "c", text: "Совместное хобби" }, { id: "d", text: "Приключение" }, { id: "e", text: "Видеозвонок" }] },
  { id: 6, question: "Как часто видеться с партнером?", options: [{ id: "a", text: "Каждый день" }, { id: "b", text: "Несколько раз в неделю" }, { id: "c", text: "Раз в неделю" }, { id: "d", text: "Зависит от настроения" }, { id: "e", text: "Важно качество" }] },
  { id: 7, question: "Отношение к технологиям?", options: [{ id: "a", text: "Техно-энтузиаст" }, { id: "b", text: "Умеренно" }, { id: "c", text: "Минимально" }, { id: "d", text: "Зависит от сферы" }, { id: "e", text: "Открыт к новому" }] },
  { id: 8, question: "Отношение к детям?", options: [{ id: "a", text: "Хочу большую семью" }, { id: "b", text: "Один ребенок" }, { id: "c", text: "Пока не думал" }, { id: "d", text: "Не хочу" }, { id: "e", text: "Главное - партнер" }] },
  { id: 9, question: "Стиль жизни?", options: [{ id: "a", text: "ЗОЖ, ранние подъемы" }, { id: "b", text: "Ночной график" }, { id: "c", text: "Баланс работы и отдыха" }, { id: "d", text: "Работа на первом месте" }, { id: "e", text: "Живу в удовольствие" }] },
  { id: 10, question: "Отношение к путешествиям?", options: [{ id: "a", text: "Обожаю, бываю везде" }, { id: "b", text: "Люблю, но редко" }, { id: "c", text: "Качество важнее" }, { id: "d", text: "Раз в год достаточно" }, { id: "e", text: "Лучше дома" }] },
];

export default function AssessmentPage() {
  const { user, refreshProfile } = useSupabase();
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const currentQ = QUESTIONS[step];
  const selected = answers[currentQ?.id];

  const select = (id: string) => {
    setAnswers({ ...answers, [currentQ.id]: id });
  };

  const next = async () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      if (user) {
        const results = {
          completedAt: new Date().toISOString(),
          personalityType: getPersonalityType(answers),
          strengths: getStrengths(answers),
          idealPartner: getIdealPartner(answers),
          datingStyle: getDatingStyle(answers),
        };
        
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, bio')
            .eq('id', user.id)
            .single();

          const assessmentMarker = "🎯ИИ_АНАЛИЗ_START" + JSON.stringify(results) + "ИИ_АНАЛИЗ_END";
          
          let newBio = assessmentMarker;
          if (existingProfile?.bio && !existingProfile.bio.includes("ИИ_АНАЛИЗ_START")) {
            newBio = existingProfile.bio + "\n\n" + assessmentMarker;
          }

          if (existingProfile) {
            await supabase.from('profiles').update({ 
              bio: newBio,
              updated_at: new Date().toISOString() 
            }).eq('id', user.id);
          } else {
            await supabase.from('profiles').insert({ 
              id: user.id, 
              bio: newBio,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString() 
            });
          }
          console.log("Assessment results saved successfully");
          await refreshProfile();
          // Small delay to ensure data is saved
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("Error saving assessment results:", error);
        }
      }
    }
  };

  const getPersonalityType = (answers: Record<number, string>) => {
    const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0, e: 0 };
    Object.values(answers).forEach(a => counts[a] = (counts[a] || 0) + 1);
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const types: Record<string, string> = {
      a: "Активный исследователь",
      b: "Мечтатель-интроверт", 
      c: "Социальный бабочка",
      d: "Карьерный стратег",
      e: "Авантюрный путешественник"
    };
    return types[max] || "Универсальный тип";
  };

  const getStrengths = (answers: Record<number, string>) => {
    const strengths: string[] = [];
    if (answers[1] === 'a') strengths.push("Энергичность");
    if (answers[2] === 'a') strengths.push("Романтичность");
    if (answers[3] === 'b') strengths.push("Интеллект");
    if (answers[4] === 'a') strengths.push("Открытость");
    if (answers[7] === 'a') strengths.push("Техно-энтузиазм");
    if (strengths.length === 0) strengths.push("Баланс");
    return strengths;
  };

  const getIdealPartner = (answers: Record<number, string>) => {
    if (answers[2] === 'a') return "Романтичный и внимательный";
    if (answers[2] === 'b') return "Практичный и стабильный";
    if (answers[2] === 'c') return "Эмоциональный и чуткий";
    if (answers[2] === 'd') return "Спокойный и надёжный";
    return "Активный и жизнерадостный";
  };

  const getDatingStyle = (answers: Record<number, string>) => {
    if (answers[5] === 'a') return "Классический ужин";
    if (answers[5] === 'b') return "Непринуждённая прогулка";
    if (answers[5] === 'c') return "Совместное хобби";
    if (answers[5] === 'd') return "Приключения";
    return "Видеосвидание";
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  if (done) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Готово!</h2>
          <p className="text-muted-foreground mb-6">Твой профиль совместимости построен</p>
          <div className="space-y-3">
            <Button onClick={() => { refreshProfile(); router.push('/profile'); }} className="rounded-full w-full neo-glow">
              Смотреть результаты
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="rounded-full w-full">
              К поиску
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 text-sm mb-4">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <span className="text-primary">AI Анализ</span>
          </div>
          <h1 className="text-3xl font-bold">Познай себя</h1>
          <p className="text-muted-foreground mt-2">Выбери вариант который тебе подходит</p>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Вопрос {step + 1} из {QUESTIONS.length}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-medium mb-6">{currentQ?.question}</h2>
          
          <div className="space-y-3 mb-6">
            {currentQ?.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => select(opt.id)}
                className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all ${
                  selected === opt.id
                    ? 'bg-gradient-to-r from-primary to-pink-500 text-white'
                    : 'glass border border-white/10 hover:border-primary/30'
                }`}
              >
                <span>{opt.text}</span>
                {selected === opt.id && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={back} disabled={step === 0} className="rounded-full">
              Назад
            </Button>
            <Button onClick={next} disabled={!selected} className="flex-1 rounded-full neo-glow">
              {step === QUESTIONS.length - 1 ? 'Завершить' : 'Далее'}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
