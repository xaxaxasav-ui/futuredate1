import { supabase } from "./supabase";
import { createNotification } from "./notifications";

export const DEFAULT_GIFTS = [
  { id: 'rose', name: 'Роза', emoji: '🌹', is_active: true },
  { id: 'heart', name: 'Сердце', emoji: '❤️', is_active: true },
  { id: 'star', name: 'Звезда', emoji: '⭐', is_active: true },
  { id: 'fire', name: 'Огонь', emoji: '🔥', is_active: true },
  { id: 'kiss', name: 'Поцелуй', emoji: '💋', is_active: true },
  { id: 'cake', name: 'Торт', emoji: '🎂', is_active: true },
  { id: 'ring', name: 'Кольцо', emoji: '💍', is_active: true },
  { id: 'diamond', name: 'Бриллиант', emoji: '💎', is_active: true },
  { id: 'car', name: 'Машина', emoji: '🚗', is_active: true },
  { id: 'house', name: 'Дом', emoji: '🏠', is_active: true },
  { id: 'rocket', name: 'Ракета', emoji: '🚀', is_active: true },
  { id: 'crown', name: 'Корона', emoji: '👑', is_active: true },
];

export async function getGifts() {
  const { data } = await supabase
    .from('gifts_catalog')
    .select('*')
    .eq('is_active', true)
    .order('id');
  
  return data && data.length > 0 ? data : DEFAULT_GIFTS.map(g => ({ ...g, is_active: true }));
}

export async function sendGift({
  senderId,
  receiverId,
  giftId,
  message
}: {
  senderId: string;
  receiverId: string;
  giftId: string;
  message?: string;
}) {
  const gifts = await getGifts();
  const gift = gifts.find((g: any) => g.id === giftId);
  if (!gift) throw new Error('Gift not found');
  
  try {
    const { data, error } = await supabase.from('gifts').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      gift_type: giftId,
      gift_name: gift.name,
      gift_emoji: gift.emoji,
      message: message || null,
    }).select();

    if (error) {
      console.error('Error inserting gift:', error);
      throw error;
    }
    
    createNotification({
      userId: receiverId,
      type: 'message',
      title: 'Получен подарок! 🎁',
      message: message 
        ? `${gift.emoji} ${gift.name} с сообщением: "${message}"`
        : `${gift.emoji} ${gift.name}`,
      fromUserId: senderId,
      link: `/profile/${senderId}`
    });
    
    return { success: true };
  } catch (e) {
    console.error('Error sending gift:', e);
    throw e;
  }
}

export async function getSentGifts(userId: string) {
  const { data } = await supabase
    .from('gifts')
    .select('*, receiver:profiles!gifts_receiver_id_fk(id, full_name, avatar_url)')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export async function getReceivedGifts(userId: string) {
  const { data } = await supabase
    .from('gifts')
    .select('*, sender:profiles!gifts_sender_id_fk(id, full_name, avatar_url)')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}