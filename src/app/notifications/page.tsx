"use client";

import { useState, useEffect } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, MessageSquare, Star, Bell, Check, Trash2, Eye } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
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
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setShowContent(true);
    }
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (user) {
      fetchNotifications();
    }
  }, [authLoading, user, router]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
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

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'favorite':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'match':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'verification':
        return <Check className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading && !showContent) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button variant="outline" onClick={markAllAsRead}>
              Прочитать все
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            Все
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('unread')}
          >
            Непрочитанные
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет уведомлений</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' 
                ? 'У вас нет непрочитанных уведомлений' 
                : 'У вас пока нет уведомлений'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <GlassCard 
                key={notification.id} 
                className={`p-4 transition-all ${
                  !notification.is_read 
                    ? 'bg-primary/5 border-l-4 border-l-primary' 
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <h3 className="font-medium">{notification.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
