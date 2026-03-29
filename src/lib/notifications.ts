import { supabase } from "./supabase";

export type NotificationType = 'like' | 'message' | 'favorite' | 'match' | 'verification';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, fromUserId, fromUserName, fromUserAvatar, link } = params;

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        from_user_id: fromUserId || null,
        from_user_name: fromUserName || null,
        from_user_avatar: fromUserAvatar || null,
        is_read: false,
        link: link || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Table may not exist, silently ignore
    }
  } catch (error) {
    // Silently ignore errors
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
}
