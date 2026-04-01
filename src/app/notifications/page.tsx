"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, MessageSquare, Star, Bell, Check, Trash2, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'message' | 'favorite' | 'match' | 'verification';
  title: string;
  message: string;
  from_user_id: string | null;
  from_user_name: string | null;
  from_user_avatar: string | null;
  is_read: boolean;
  created_at: string;
  link: string | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          fetchNotifications(session.user.id);
        } else {
          router.push("/auth");
        }
      } catch (e) {
        router.push("/auth");
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  }, [router]);

  const fetchNotifications = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen relative pt-24 pb-6 px-6 overflow-hidden">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Уведомления</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `У вас ${unreadCount} непрочитанных уведомлений` : 'Нет новых уведомлений'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={async () => {
              if (!user) return;
              await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }}>
              Прочитать все
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
            className="rounded-full"
          >
            Все
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            onClick={() => setFilter('unread')}
            className="rounded-full"
          >
            Непрочитанные
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Нет уведомлений</h3>
            <p className="text-muted-foreground">Здесь появятся уведомления о лайках, сообщениях и других событиях.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || '#'}
                className="block"
              >
                <GlassCard className={`p-4 flex gap-4 ${!notification.is_read ? 'border-primary/50' : ''}`}>
                  <div className="relative">
                    <img 
                      src={notification.from_user_avatar || PlaceHolderImages[0].imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      {notification.type === 'like' && <Heart className="w-4 h-4 text-pink-500" />}
                      {notification.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                      {notification.type === 'favorite' && <Star className="w-4 h-4 text-yellow-500" />}
                      {notification.type === 'match' && <Heart className="w-4 h-4 text-red-500" />}
                      {notification.type === 'verification' && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{notification.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString('ru')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                  )}
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
