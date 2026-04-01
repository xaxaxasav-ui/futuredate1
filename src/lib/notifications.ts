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

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    // Get matches for this user
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
    
    if (!matches || matches.length === 0) return 0;
    
    const matchIds = matches.map(m => m.id);
    
    // Get unread messages count (messages where user is NOT the sender)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .neq('sender_id', userId);
    
    return count || 0;
  } catch (e) {
    console.error('Error getting unread messages count:', e);
    return 0;
  }
}

export async function markMessagesAsRead(userId: string): Promise<void> {
  try {
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
    
    if (!matches || matches.length === 0) return;
    
    const matchIds = matches.map(m => m.id);
    
    // Mark all messages from others as read (in a real app you'd have a read_at column)
    // For now we'll just track via notifications
  } catch (e) {
    console.error('Error marking messages as read:', e);
  }
}