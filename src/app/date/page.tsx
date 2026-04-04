"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Phone, Sparkles, MessageCircle, Volume2, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { createNotification } from "@/lib/notifications";

const APP_ID = "96e592a19ed244138a1349e960da941f";

function VideoDateContent() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const agoraClientRef = useRef<any>(null);
  const localTracksRef = useRef<any[]>([]);

  const [partnerData, setPartnerData] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [callingTo, setCallingTo] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (searchParams) {
      setPartnerId(searchParams.get('user'));
      const callId = searchParams.get('call');
      if (callId) {
        setCurrentCallId(callId);
        setCallStatus('incoming');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if ((callStatus === 'connected' || callStatus === 'incoming') && currentCallId) {
      joinAgoraChannel(currentCallId);
    }
  }, [callStatus, currentCallId]);

  useEffect(() => {
    if (callStarted) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStarted]);

  useEffect(() => {
    async function loadPartner() {
      if (!partnerId) return;
      setLoadingPartner(true);
      console.log('Loading partner data for:', partnerId);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, photos')
          .eq('id', partnerId)
          .single();
        console.log('Partner data loaded:', data, error);
        setPartnerData(data);
      } catch (e) {
        console.error('Error loading partner:', e);
      } finally {
        setLoadingPartner(false);
      }
    }
    loadPartner();
  }, [partnerId, supabase]);

  const partnerImg = partnerData?.avatar_url || partnerData?.photos?.[0] || PlaceHolderImages[1].imageUrl;

  const checkCallStatus = async (callId: string) => {
    try {
      const { data } = await supabase
        .from('calls')
        .select('status')
        .eq('id', callId)
        .single();
      return data?.status;
    } catch (e) {
      return null;
    }
  };

  const joinAgoraChannel = async (channelId: string) => {
    try {
      console.log('Joining Agora channel:', channelId, 'App ID:', APP_ID);
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      console.log('Client created');
      agoraClientRef.current = client;

      console.log('Attempting to join...', { appId: APP_ID, channelId, token: null });
      await client.join(APP_ID, channelId, null, null);
      console.log('Joined successfully');

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks({
        AEC: true,
        ANS: true,
        AGC: true,
      });
      console.log('Local tracks created');
      localTracksRef.current = [audioTrack, videoTrack];

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish(localTracksRef.current);

      client.on('user-published', async (remoteUser: any, mediaType: string) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === 'video' && remoteVideoRef.current) {
          remoteUser.videoTrack.play(remoteVideoRef.current);
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack.play();
        }
      });

      client.on('user-left', (remoteUser: any) => {
        console.log('User left:', remoteUser.uid);
        endCall();
      });

      setCallStarted(true);
    } catch (e: any) {
      console.error('Agora join error:', e);
      if (e.message?.includes('dynamic use static key') || e.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
        setError('Ошибка подключения: требуется настройка токена в Agora Console');
      } else {
        setError('Ошибка подключения: ' + (e.message || e.code || 'unknown'));
      }
    }
  };

  const initiateCall = async () => {
    if (!user || !partnerId) {
      console.log('❌ No user or partnerId', { user: user?.id, partnerId });
      return;
    }
    
    console.log('📱 Initiating call from', user.id, 'to', partnerId);
    
    setCallingTo(true);
    setCallStatus('calling');
    try {
      console.log('🔄 Creating call record in database...');
      const { data: call, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: partnerId,
          status: 'pending',
        })
        .select()
        .single();

      console.log('📱 Call created:', call, error);
      console.log('📱 Call ID:', call?.id);
      console.log('📱 Receiver ID in DB:', partnerId);

      if (error || !call) {
        console.error('Failed to create call:', error);
        setCallingTo(false);
        setCallStatus(null);
        return;
      }

      setCurrentCallId(call.id);

      await createNotification({
        userId: partnerId,
        type: 'message',
        title: 'Входящий звонок! 📞',
        message: `${user.user_metadata?.full_name || 'Пользователь'} звонит вам!`,
        fromUserId: user.id,
        fromUserName: user.user_metadata?.full_name || 'Пользователь',
        fromUserAvatar: user.user_metadata?.avatar_url || undefined,
        link: `/date?user=${user.id}&call=${call.id}`
      });

      const statusCheck = setInterval(async () => {
        const status = await checkCallStatus(call.id);
        if (status === 'accepted') {
          clearInterval(statusCheck);
          setCallStatus('connected');
          joinAgoraChannel(call.id);
        } else if (status === 'declined') {
          clearInterval(statusCheck);
          setCallStatus('declined');
          setCallingTo(false);
        }
      }, 2000);

      setTimeout(() => {
        if (callStatus === 'calling') {
          clearInterval(statusCheck);
          setCallingTo(false);
          setCallStatus(null);
          alert('Абонент не отвечает');
        }
      }, 30000);
    } catch (e) {
      console.error('Error initiating call:', e);
      setError('Ошибка при звонке');
      setCallingTo(false);
      setCallStatus(null);
    }
  };

  const endCall = async () => {
    try {
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
        agoraClientRef.current = null;
      }
      
      localTracksRef.current.forEach((track: any) => {
        try {
          track.stop();
          track.close();
        } catch (e) {}
      });
      localTracksRef.current = [];
    } catch (e) {
      console.error('Error leaving Agora:', e);
    }
    
    if (currentCallId) {
      await supabase
        .from('calls')
        .update({ status: 'completed' })
        .eq('id', currentCallId);
    }

    setCallStarted(false);
    setCallDuration(0);
    setCallStatus(null);
    setCurrentCallId(null);
    router.push('/messages');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (localTracksRef.current[0]) {
      localTracksRef.current[0].setEnabled(!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (localTracksRef.current[1]) {
      localTracksRef.current[1].setEnabled(!isVideoOff);
    }
  }, [isVideoOff]);

  const generateIcebreaker = () => {
    const ICEBREAKERS = [
      "Расскажи о своём самом необычном путешествии.",
      "Если бы ты мог жить в любой эпохе, какую бы выбрал?",
      "Какой навык ты хотел бы освоить за неделю?",
      "Что тебя больше всего рассмешило в последнее время?",
    ];
    setIsGenerating(true);
    setTimeout(() => {
      const randomIcebreaker = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
      setIcebreaker(randomIcebreaker);
      setIsGenerating(false);
    }, 1000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>
      
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {!callStarted ? (
          <div className="relative z-10 text-center space-y-8">
            {partnerImg && (
              <div className="w-32 h-32 rounded-full mx-auto overflow-hidden border-4 border-primary/30">
                <img src={partnerImg} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">{loadingPartner ? 'Загрузка...' : partnerData?.full_name || 'Пользователь'}</h2>
              <p className="text-muted-foreground">
                {callStatus === 'calling' ? 'Ожидание ответа...' : 'Готов к видеозвонку'}
              </p>
            </div>
            
            {error && (
              <div className="text-destructive px-4 py-2 glass rounded-lg">
                {error}
              </div>
            )}

            {callStatus === 'declined' && (
              <div className="text-destructive px-4 py-2 glass rounded-lg">
                Абонент отклонил звонок
              </div>
            )}

            {callStatus === 'incoming' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <Phone className="w-6 h-6 animate-pulse" />
                  <span>Входящий звонок</span>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="destructive"
                    onClick={async () => {
                      if (currentCallId) {
                        await supabase.from('calls').update({ status: 'declined' }).eq('id', currentCallId);
                      }
                      setCallStatus(null);
                      setCurrentCallId(null);
                      router.push('/messages');
                    }}
                    className="rounded-full px-6"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Отклонить
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (currentCallId) {
                        await supabase.from('calls').update({ status: 'accepted' }).eq('id', currentCallId);
                      }
                      setCallStatus('connected');
                    }}
                    className="rounded-full px-6 neo-glow"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Принять
                  </Button>
                </div>
              </div>
            )}

            {callingTo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Звоним...</span>
                </div>
                <Button 
                  variant="ghost"
                  onClick={async () => {
                    if (currentCallId) {
                      await supabase.from('calls').update({ status: 'cancelled' }).eq('id', currentCallId);
                    }
                    setCallingTo(false);
                    setCallStatus(null);
                    setCurrentCallId(null);
                  }}
                  className="rounded-full px-6 glass"
                >
                  Отменить
                </Button>
              </div>
            ) : (
              <Button 
                onClick={initiateCall}
                className="rounded-full px-8 h-14 neo-glow text-lg"
              >
                <Video className="w-5 h-5 mr-2" />
                Позвонить
              </Button>
            )}

            <Button 
              variant="ghost"
              onClick={() => router.push('/messages')}
              className="rounded-full px-6 glass"
            >
              Назад к сообщениям
            </Button>
          </div>
        ) : (
          <>
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 text-xs font-semibold text-primary uppercase">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Соединение
              </div>
              <h2 className="text-4xl font-bold">{loadingPartner ? 'Загрузка...' : partnerData?.full_name || 'Пользователь'}</h2>
            </div>

            <div className="absolute bottom-24 right-8 w-32 aspect-[3/4] glass rounded-2xl overflow-hidden border-2 border-white/10 group">
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline 
                muted
                className={`object-cover w-full h-full ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <VideoOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 glass rounded text-[10px] uppercase font-bold tracking-widest">Вы</div>
            </div>

            {icebreaker && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <GlassCard className="p-6 border-primary/30 relative">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">ИИ Совет</span>
                  </div>
                  <p className="text-lg font-medium leading-relaxed italic">"{icebreaker}"</p>
                  <button 
                    onClick={() => setIcebreaker(null)} 
                    className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                  >
                    ×
                  </button>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>

      {callStarted && (
        <div className="h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between px-8 relative z-50">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Длительность</span>
              <span className="font-mono text-primary font-bold">{formatDuration(callDuration)}</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <Button variant="ghost" className="rounded-full glass" onClick={generateIcebreaker} disabled={isGenerating}>
              <Sparkles className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} /> 
              {isGenerating ? 'Анализ...' : 'Ледокол'}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full h-12 w-12 glass ${isMuted ? 'text-destructive border-destructive/40' : 'text-white'}`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full h-12 w-12 glass ${isVideoOff ? 'text-destructive border-destructive/40' : 'text-white'}`}
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full h-14 w-14 neo-glow-destructive"
              onClick={endCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full glass h-12 w-12">
              <Volume2 className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full glass h-12 w-12">
              <MessageCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoDatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VideoDateContent />
    </Suspense>
  );
}