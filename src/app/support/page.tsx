"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Mail, MessageSquare, Phone, Clock, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const FAQ_ITEMS = [
  {
    question: "Как пройти верификацию?",
    answer: "Перейдите на страницу верификации и сделайте селфи с жестом ✌️. Администратор проверит вашу заявку в течение 24 часов."
  },
  {
    question: "Как изменить профиль?",
    answer: "Перейдите в раздел 'Профиль' и нажмите кнопку 'Редактировать'. Там вы можете изменить имя, фото, описание и другие данные."
  },
  {
    question: "Почему меня забанили?",
    answer: "Бан может быть выдан за нарушение правил: попытка общения вне сервиса, оскорбления, спам или другие нарушения. Свяжитесь с поддержкой для уточнения причины."
  },
  {
    question: "Как найти людей рядом?",
    answer: "Перейдите в раздел 'Рядом' на главной странице. Приложение покажет пользователей, находящихся вблизи от вашего местоположения."
  },
  {
    question: "Как удалить аккаунт?",
    answer: "Перейдите в профиль -> Настройки -> Удалить аккаунт. Внимание: это действие необратимо."
  }
];

export default function SupportPage() {
  const { user, loading: authLoading } = useSupabase();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    message: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchTickets();
    } else if (!authLoading && !user) {
      setLoading(false);
      setShowContent(true);
    }
  }, [authLoading, user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setTickets(data);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          message: formData.message,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setFormData({ subject: "", message: "" });
      setShowForm(false);
      setSuccess("Обращение отправлено! Мы ответим в ближайшее время.");
      fetchTickets();
    } catch (err: any) {
      console.error("Error submitting ticket:", err);
      setError("Ошибка при отправке. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading && !showContent) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 overflow-hidden">
        
        <div className="max-w-4xl mx-auto py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Техническая поддержка</h1>
          <p className="text-muted-foreground mb-8">Пожалуйста, войдите в систему, чтобы обратиться в поддержку.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-6 px-6 overflow-hidden">
      
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline">Техническая поддержка</h1>
          <p className="text-muted-foreground">Мы всегда готовы помочь!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard className="p-6 text-center">
            <div className="p-3 bg-primary/20 rounded-xl inline-flex mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Email</h3>
            <p className="text-sm text-muted-foreground">support@date-future.ru</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="p-3 bg-primary/20 rounded-xl inline-flex mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Онлайн-чат</h3>
            <p className="text-sm text-muted-foreground">Ответим 24/7</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="p-3 bg-primary/20 rounded-xl inline-flex mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Время работы</h3>
            <p className="text-sm text-muted-foreground">Круглосуточно</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border-b border-white/10 pb-4 last:border-0">
                <h3 className="font-medium mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Мои обращения</h2>
            <Button onClick={() => { setShowForm(!showForm); setError(""); }} className="neo-glow">
              <Send className="w-4 h-4 mr-2" />
              Новое обращение
            </Button>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{success}</span>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white/5 rounded-xl space-y-4">
              <div>
                <Label>Тема обращения</Label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Кратко опишите проблему..."
                  className="glass"
                />
              </div>
              <div>
                <Label>Сообщение</Label>
                <Textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Подробно опишите вашу проблему..."
                  className="glass"
                  rows={5}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="neo-glow">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Отправить
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">У вас пока нет обращений</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <Badge variant={ticket.status === 'pending' ? 'outline' : 'default'}>
                      {ticket.status === 'pending' ? 'Ожидает' : ticket.status === 'answered' ? 'Отвечено' : 'Закрыт'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
