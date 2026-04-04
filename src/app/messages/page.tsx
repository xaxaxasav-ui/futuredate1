"use client";

import { useState, useEffect, useRef } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, Search, MoreVertical, Loader2, ShieldAlert, Trash2, Ban, X, Smile, Image, Paperclip, CheckCheck, BellOff, Mic, Plus, File, Volume2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

interface ChatMessage {
  role: 'user' | 'partner';
  text: string;
  time: string;
  isRead?: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  avatar: string;
  online: boolean;
}

const MOCK_CHATS: Chat[] = [
  { id: "1", name: "Елена", lastMsg: "Увидимся в виртуальном мире?", time: "2м", avatar: PlaceHolderImages[1].imageUrl, online: true },
  { id: "2", name: "Маркус", lastMsg: "Та симуляция туманности была безумной.", time: "1ч", avatar: PlaceHolderImages[2].imageUrl, online: false },
  { id: "3", name: "Саша", lastMsg: "Поделилась новым фрагментом личности.", time: "4ч", avatar: PlaceHolderImages[3].imageUrl, online: true },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  { role: 'partner', text: 'Привет! Я только что увидела наш показатель совместимости. 98% — это просто невероятно, правда?', time: '12:01' },
  { role: 'user', text: 'Точно! ИИ иногда знает меня лучше, чем я сам.', time: '12:05' },
  { role: 'partner', text: 'Готов к нашему первому виртуальному свиданию сегодня вечером?', time: '12:06' },
];

const PROHIBITED_PATTERNS = {
  links: /https?:\/\/[^\s]+|www\.[^\s]+|\.ru[^\s]*|\.com[^\s]*|\.org[^\s]*/gi,
  phone: /(\+7|8|7)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}|\d{10,11}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  messengers: /вацап|whatsapp|вотсап|вайбер|viber|телеграм|telegram|в телеграм|в вацап|в вайбер|добавляйся|добавь|пиши в|звони в|контакт|connect|write me|write to/i,
};

function checkProhibitedContent(text: string): { isProhibited: boolean; reason: string } {
  if (PROHIBITED_PATTERNS.links.test(text)) {
    return { isProhibited: true, reason: 'Запрещены ссылки' };
  }
  if (PROHIBITED_PATTERNS.phone.test(text)) {
    return { isProhibited: true, reason: 'Запрещены номера телефонов' };
  }
  if (PROHIBITED_PATTERNS.email.test(text)) {
    return { isProhibited: true, reason: 'Запрещена почта' };
  }
  if (PROHIBITED_PATTERNS.messengers.test(text)) {
    return { isProhibited: true, reason: 'Запрещены приглашения в другие мессенджеры' };
  }
  return { isProhibited: false, reason: '' };
}

function MessagesContent() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WhatsApp-style emoji groups
  const EMOJI_GROUPS = [
    { name: 'Смайлики', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '🤥', '😔', '😪', '🤤'] },
    { name: 'Жесты', emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✍️', '🙏', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'] },
    { name: 'Любовь', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'] },
    { name: 'Природа', emojis: ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌾', '🌵', '🎋', '🎍', '🌴', '🌳', '🌲', '🌱', '🌿', '🍄', '🐚', '🌊', '💧', '💦', '☔', '☂️', '🌬️', '❄️', '☃️', '⛄', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️'] },
    { name: 'Еда', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈'] },
    { name: 'Животные', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲'] },
    { name: 'Праздники', emojis: ['🎃', '🎄', '🎆', '🎇', '🧨', '🎈', '🎉', '🎊', '🎁', '🏮', '🪔', '🏮', '🎀', '🎗️', '🎟️', '🎫', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🎳', '🏆', '🥇', '🥈'] },
    { name: 'Другое', emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '💰', '💳', '💎', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️'] },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 60000);
    } catch (e) {
      console.error('Error starting recording:', e);
      alert('Не удалось начать запись. Проверьте разрешения микрофона.');
    }
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    if (!activeChat || !user) return;
    
    try {
      const fileName = `audio-${Date.now()}.webm`;
      const filePath = `audio/${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, audioBlob);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      await supabase.from('messages').insert({
        match_id: activeChat.id,
        sender_id: user.id,
        content: `[Аудио]`,
        is_read: false,
      });
      
      // Send notification
      const otherUserId = activeChat.id.includes('_') 
        ? activeChat.id.split('_').find(id => id !== user.id) 
        : null;
      
      if (otherUserId) {
        createNotification({
          userId: otherUserId,
          type: 'message',
          title: 'Новое голосовое сообщение!',
          message: `${user.user_metadata?.full_name || 'Пользователь'} отправил голосовое`,
          fromUserId: user.id,
          fromUserName: user.user_metadata?.full_name || 'Пользователь',
          fromUserAvatar: user.user_metadata?.avatar_url || undefined,
          link: `/messages?chat=${activeChat.id}`
        });
      }
    } catch (e) {
      console.error('Error sending audio:', e);
      alert('Ошибка отправки аудио');
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !user) return;
    
    setShowAttachmentMenu(false);
    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `documents/${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      await supabase.from('messages').insert({
        match_id: activeChat.id,
        sender_id: user.id,
        content: `[Файл: ${file.name}]`,
        is_read: false,
      });
      
      // Send notification
      const otherUserId = activeChat.id.includes('_') 
        ? activeChat.id.split('_').find(id => id !== user.id) 
        : null;
      
      if (otherUserId) {
        createNotification({
          userId: otherUserId,
          type: 'message',
          title: 'Новый файл!',
          message: `${user.user_metadata?.full_name || 'Пользователь'} отправил файл: ${file.name}`,
          fromUserId: user.id,
          fromUserName: user.user_metadata?.full_name || 'Пользователь',
          fromUserAvatar: user.user_metadata?.avatar_url || undefined,
          link: `/messages?chat=${activeChat.id}`
        });
      }
    } catch (e) {
      console.error('Error uploading document:', e);
      alert('Ошибка загрузки файла');
    } finally {
      setUploadingImage(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !user) return;
    
    setShowAttachmentMenu(false);
    
    try {
      const fileName = `audio-${Date.now()}.webm`;
      const filePath = `audio/${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      await supabase.from('messages').insert({
        match_id: activeChat.id,
        sender_id: user.id,
        content: `[Аудио]`,
        is_read: false,
      });
      
      const otherUserId = activeChat.id.includes('_') 
        ? activeChat.id.split('_').find(id => id !== user.id) 
        : null;
      
      if (otherUserId) {
        createNotification({
          userId: otherUserId,
          type: 'message',
          title: 'Новое аудио!',
          message: `${user.user_metadata?.full_name || 'Пользователь'} отправил аудио`,
          fromUserId: user.id,
          fromUserName: user.user_metadata?.full_name || 'Пользователь',
          fromUserAvatar: user.user_metadata?.avatar_url || undefined,
          link: `/messages?chat=${activeChat.id}`
        });
      }
    } catch (e) {
      console.error('Error uploading audio:', e);
      alert('Ошибка загрузки аудио');
    } finally {
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/auth";
    }
  }, [authLoading, user]);

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setActiveChat(chat);
      }
    }
  }, [searchParams, chats]);

  useEffect(() => {
    const loadChats = async () => {
      if (!user) {
        setLoadingChats(false);
        return;
      }
      try {
        console.log('Loading chats for user:', user.id);
        
        const { data: matches, error } = await supabase
          .from('matches')
          .select('*')
          .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
          .eq('status', 'accepted');

        console.log('Matches response:', { matches, error });

        if (error) {
          console.error("Error loading matches:", error);
          setChats([]);
          setLoadingChats(false);
          return;
        }

        if (matches && matches.length > 0) {
          console.log('Found matches:', matches.length);
          const loadedChats: Chat[] = [];
          
          for (const m of matches) {
            const otherUserId = m.user_id === user.id ? m.matched_user_id : m.user_id;
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', otherUserId)
              .single();

            loadedChats.push({
              id: m.id,
              name: profile?.full_name || profile?.username || 'Неизвестно',
              lastMsg: 'Новые сообщения',
              time: 'Сейчас',
              avatar: profile?.avatar_url || PlaceHolderImages[0].imageUrl,
              online: Math.random() > 0.5
            });
          }
          
          setChats(loadedChats);
          if (loadedChats.length > 0) {
            setActiveChat(loadedChats[0]);
          }
        } else {
          console.log('No matches found');
          setChats([]);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        setChats([]);
      } finally {
        setLoadingChats(false);
      }
    };
    loadChats();
  }, [user]);

  // Mark all notifications as read when entering messages
  useEffect(() => {
    if (user && !authLoading) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ error }) => {
          if (!error) {
            console.log('All notifications marked as read');
          }
        });
    }
  }, [user, authLoading]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat || !user) return;
      
      try {
        const { data: chatMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', activeChat.id)
          .order('created_at', { ascending: true });
        
        if (chatMessages && chatMessages.length > 0) {
          const loadedMessages: ChatMessage[] = chatMessages.map((m: any) => ({
            role: m.sender_id === user.id ? 'user' : 'partner',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: m.is_read === true
          }));
          setMessages(loadedMessages);
          
          // Mark messages as read and clear notifications
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('match_id', activeChat.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);
          
          if (!updateError) {
            await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('user_id', user.id)
              .eq('is_read', false)
              .or('type.eq.message,type.eq.like,type.eq.match');
          }
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error('Error loading messages:', e);
        setMessages([]);
      }
    };
    
    loadMessages();
  }, [activeChat, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat || !user) return;

    const check = checkProhibitedContent(input);
    if (check.isProhibited) {
      alert(`⚠️ Нарушение правил!\n\n${check.reason}\n\nОбщение за пределами сервиса запрещено.`);
      return;
    }
    
    const newMessage: ChatMessage = {
      role: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      await supabase.from('messages').insert({
        match_id: activeChat.id,
        sender_id: user.id,
        content: input,
        is_read: false,
      });
      
      // Уведомление о новом сообщении
      const otherUserId = activeChat.id.includes('_') ? activeChat.id.split('_').find(id => id !== user.id) : null;
      if (otherUserId) {
        createNotification({
          userId: otherUserId,
          type: 'message',
          title: 'Новое сообщение!',
          message: `${user.user_metadata?.full_name || 'Пользователь'} написал вам: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`,
          fromUserId: user.id,
          fromUserName: user.user_metadata?.full_name || 'Пользователь',
          fromUserAvatar: user.user_metadata?.avatar_url || undefined,
          link: `/messages?chat=${activeChat.id}`
        });
      }
    } catch (e) {
      console.error('Error saving message:', e);
    }

    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !user) return;
    
    setShowAttachmentMenu(false);
    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `messages/${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const imageMessage = `[Фото]`;
      
      await supabase.from('messages').insert({
        match_id: activeChat.id,
        sender_id: user.id,
        content: imageMessage,
        is_read: false,
      });
      
      // Refresh messages
      const { data: chatMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', activeChat.id)
        .order('created_at', { ascending: true });
      
      if (chatMessages) {
        const loadedMessages: ChatMessage[] = chatMessages.map((m: any) => ({
          role: m.sender_id === user.id ? 'user' : 'partner',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: m.is_read === true
        }));
        setMessages(loadedMessages);
      }
      
      const otherUserId = activeChat.id.includes('_') 
        ? activeChat.id.split('_').find(id => id !== user.id) 
        : null;
      
      if (otherUserId) {
        createNotification({
          userId: otherUserId,
          type: 'message',
          title: 'Новое фото!',
          message: `${user.user_metadata?.full_name || 'Пользователь'} отправил${user.user_metadata?.gender === 'female' ? 'а' : ''} фото`,
          fromUserId: user.id,
          fromUserName: user.user_metadata?.full_name || 'Пользователь',
          fromUserAvatar: user.user_metadata?.avatar_url || undefined,
          link: `/messages?chat=${activeChat.id}`
        });
      }
    } catch (e) {
      console.error('Error uploading image:', e);
      alert('Ошибка загрузки фото');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleBlockUser = async () => {
    if (!user || !activeChat) return;
    
    const newBlockedUsers = [...blockedUsers, activeChat.id];
    setBlockedUsers(newBlockedUsers);
    
    await supabase.from('profiles').update({
      profile_blocked_users: newBlockedUsers
    }).eq('id', user.id);
    
    setShowBlockDialog(false);
    setMenuOpen(false);
    setChats(prev => prev.filter(chat => chat.id !== activeChat.id));
    if (chats.length > 0) {
      setActiveChat(chats[0]);
    }
  };

  const handleDeleteChat = async () => {
    if (!user || !activeChat) return;
    
    await supabase.from('messages').delete().eq('match_id', activeChat.id);
    await supabase.from('matches').delete().eq('id', activeChat.id);
    
    const remainingChats = chats.filter(chat => chat.id !== activeChat.id);
    setChats(remainingChats);
    setMessages([]);
    setShowDeleteDialog(false);
    setMenuOpen(false);
    
    if (remainingChats.length > 0) {
      setActiveChat(remainingChats[0]);
    } else {
      setActiveChat(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative pt-24 pb-6 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-24 pb-6 px-6 overflow-hidden">
      
      
      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] relative flex gap-2 md:gap-6">
        <GlassCard className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col p-0 absolute md:relative z-10 md:z-0 h-full`}>
          <div className="p-3 md:p-6 border-b border-white/5">
            <h2 className="text-lg md:text-xl font-bold font-headline mb-3">Чаты</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Поиск..." className="glass pl-10 h-10 rounded-full" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex overflow-x-auto gap-2 p-2 pb-4">
              {loadingChats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Нет чатов</p>
                </div>
              ) : (
              chats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-colors w-20 ${activeChat?.id === chat.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5'}`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="text-sm">{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    {chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />}
                  </div>
                  <span className="text-xs truncate w-full text-center">{chat.name.split(' ')[0]}</span>
                </button>
              ))
              )}
            </div>
          </ScrollArea>
        </GlassCard>

        <GlassCard className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col p-0 absolute md:relative z-20 md:z-0 w-full h-full`}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Нет чатов. Начните общение с понравившимся пользователем!</p>
            </div>
            ) : (
            <>
            <div className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeChat.avatar} />
                  <AvatarFallback>{activeChat?.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold font-headline text-base md:text-lg">{activeChat?.name}</h3>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> В резонансе
                  </span>
                </div>
              </div>
              <div className="relative">
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-white/20 active:bg-white/30" onClick={() => setMenuOpen(!menuOpen)}>
                  <MoreVertical className="w-6 h-6 text-white" />
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden shadow-xl z-[100] bg-gray-900 border-gray-700">
                    <button
                      onClick={() => { setShowDeleteDialog(true); setMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 w-full text-left hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить чат
                    </button>
                    <button
                      onClick={() => { setShowBlockDialog(true); setMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 w-full text-left hover:bg-red-500/20"
                    >
                      <Ban className="w-4 h-4" />
                      Заблокировать
                    </button>
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'glass'}`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase px-2">{msg.time}</span>
                      {msg.role === 'user' && msg.isRead && (
                        <span className="text-[10px] text-primary">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-white/5 bg-black/10 space-y-3">
            {showEmojiPicker && (
              <GlassCard className="absolute bottom-20 left-0 right-0 mx-4 p-4 border-primary/30 z-50">
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                  {EMOJI_GROUPS.flatMap(group => 
                    group.emojis.map((emoji, idx) => (
                      <button
                        key={`${group.name}-${idx}`}
                        onClick={() => {
                          setInput(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))
                  )}
                </div>
              </GlassCard>
            )}
            
            <div className="flex items-center gap-2 p-2">
              {/* Attachment button (+ symbol) - WhatsApp style */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 flex-shrink-0"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <Plus className="w-6 h-6" />
              </Button>
              
              {/* Attachment menu popup */}
              {showAttachmentMenu && (
                <div className="absolute bottom-20 left-4 flex gap-3 z-50">
                  <div className="flex flex-col items-center gap-1">
                    <label className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                      <Image className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">Фото</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                      <File className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        ref={docInputRef}
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">Файл</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                      <Volume2 className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        ref={audioInputRef}
                        onChange={handleAudioUpload}
                        accept="audio/*"
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">Аудио</span>
                  </div>
                </div>
              )}
              
              {/* Emoji button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 flex-shrink-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-6 h-6" />
              </Button>
              
              {/* Message input - WhatsApp style */}
              <div className="flex-1 relative">
                <Input 
                  placeholder="Сообщение"
                  className="glass rounded-full h-10 px-4 pr-10"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                {input && (
                  <button 
                    onClick={handleSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Microphone button (when no text) */}
              {!input && (
                <Button 
                  size="icon"
                  className="rounded-full h-10 w-10 neo-glow flex-shrink-0"
                  onClick={() => startRecording()}
                  disabled={isRecording}
                >
                  {isRecording ? (
                    <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="text-xs text-red-400/90 text-center flex items-center justify-center gap-2 pb-2">
              <ShieldAlert className="w-3 h-3 flex-shrink-0" />
              <span>⚠️ Запрещено: ссылки, телефоны, почта, другие мессенджеры</span>
            </div>
            </div>
            </>
            )}
        </GlassCard>
      </div>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите заблокировать {activeChat?.name}? Вы больше не будете видеть сообщения друг друга.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              <Ban className="w-4 h-4 mr-2" />
              Заблокировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить чат</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить весь чат с {activeChat?.name}? Все сообщения будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
