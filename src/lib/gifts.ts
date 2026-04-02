import { supabase } from "./supabase";
import { createNotification } from "./notifications";

export const GIFTS = [
  { id: 'rose', name: 'Роза', emoji: '🌹', price: 0, premium: false },
  { id: 'heart', name: 'Сердце', emoji: '❤️', price: 0, premium: false },
  { id: 'star', name: 'Звезда', emoji: '⭐', price: 0, premium: false },
  { id: 'fire', name: 'Огонь', emoji: '🔥', price: 0, premium: false },
  { id: 'kiss', name: 'Поцелуй', emoji: '💋', price: 0, premium: false },
  { id: 'cake', name: 'Торт', emoji: '🎂', price: 0, premium: false },
  { id: 'ring', name: 'Кольцо', emoji: '💍', price: 1, premium: true },
  { id: 'diamond', name: 'Бриллиант', emoji: '💎', price: 5, premium: true },
  { id: 'car', name: 'Машина', emoji: '🚗', price: 10, premium: true },
  { id: 'house', name: 'Дом', emoji: '🏠', price: 20, premium: true },
  { id: 'rocket', name: 'Ракета', emoji: '🚀', price: 50, premium: true },
  { id: 'crown', name: 'Корона', emoji: '👑', price: 100, premium: true },
];

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
  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) throw new Error('Gift not found');
  
  try {
    await supabase.from('gifts').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      gift_type: giftId,
      message: message || null,
      is_premium: gift.premium,
    });
    
    createNotification({
      userId: receiverId,
      type: 'message',
      title: gift.premium ? `Получен подарок ${gift.emoji}!` : 'Получен подарок!',
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
    .select('*, receiver:profiles!gifts_receiver_id_fk(full_name, avatar_url)')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export async function getReceivedGifts(userId: string) {
  const { data } = await supabase
    .from('gifts')
    .select('*, sender:profiles!gifts_sender_id_fk(full_name, avatar_url)')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}