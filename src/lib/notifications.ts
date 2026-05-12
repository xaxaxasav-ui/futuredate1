import { supabase } from "./supabase";

async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 2
): Promise<T | null> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await queryFn();
      if (!result.error || result.data) {
        return result.data;
      }
      lastError = result.error;
    } catch (e) {
      lastError = e;
    }
    
    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
  }
  
  console.warn('Query failed after retries:', lastError?.message);
  return null;
}

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
  return queryWithRetry(async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { data: count, error };
  }).then(data => data || 0);
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  return queryWithRetry(async () => {
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
    
    if (!matches || matches.length === 0) {
      return { data: 0, error: null };
    }
    
    const matchIds = matches.map(m => m.id);
    
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', matchIds)
      .neq('sender_id', userId);
    
    return { data: count, error };
  }).then(data => data || 0);
}

export async function markMessagesAsRead(userId: string): Promise<void> {
  await queryWithRetry(async () => {
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
    
    if (!matches || matches.length === 0) {
      return { data: true, error: null };
    }
    
    return { data: true, error: null };
  });
}