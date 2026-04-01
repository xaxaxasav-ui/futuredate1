import { supabase } from "./supabase";

export async function createNotification({
  userId,
  type,
  title,
  message,
  fromUserId,
  fromUserName,
  fromUserAvatar,
  link
}: {
  userId: string;
  type: 'like' | 'message' | 'favorite' | 'match' | 'view' | 'verification';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  link?: string;
}) {
  try {
    await supabase.from('notifications').insert({
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
  } catch (e) {
    console.error('Error creating notification:', e);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  } catch (e) {
    console.error('Error getting unread count:', e);
    return 0;
  }
}