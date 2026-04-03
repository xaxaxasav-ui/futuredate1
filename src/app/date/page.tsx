"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Sparkles, MessageCircle, Volume2, Loader2, Phone, PhoneIncoming } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { Suspense } from "react";

const APP_ID = "9ff80e5c2be740deb61195e461353e19";

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
  const clientRef = useRef<any>(null);
  const localTracksRef = useRef<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [partnerData, setPartnerData] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);
  
  const [incomingCall, setIncomingCall] = useState<any>(null);
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
      }
    }
  }, [searchParams]);

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
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, photos')
          .eq('id', partnerId)
          .single();
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

  const initiateCall = async () => {
    if (!user || !partnerId) return;
    
    setCallingTo(true);
    setCallStatus('calling');
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          receiver_id: partnerId,
          status: 'pending',
        })
        .select()
        .single();

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
          startAgoraCall(call.id);
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

  const startAgoraCall = async (callId: string) => {
    try {
      setError('Подключение...');
      
      // Load Agora from CDN
      if (!(window as any).AgoraRTC) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.agora.io/sdk/release/AgoraRTC_N.js';
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Failed to load Agora'));
          document.head.appendChild(script);
        });
      }
      
      const AgoraRTC = (window as any).AgoraRTC;
      if (!AgoraRTC) {
        throw new Error('Agora not available');
      }
      
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      console.log('Initializing Agora with appId:', APP_ID);
      await client.init(APP_ID);
      console.log('Agora init success, joining channel:', callId);
      
      // Join with null token (for testing)
      await client.join(APP_ID, callId, null, user?.id);
      console.log('Joined channel, creating tracks...');
      
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];
      
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      await client.publish(localTracksRef.current);
      console.log('Published local tracks');
      
      client.on('user-published', async (remoteUser: any, mediaType: string) => {
        console.log('User published:', remoteUser.uid, mediaType);
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === 'video' && remoteVideoRef.current) {
          remoteUser.videoTrack.play(remoteVideoRef.current);
        }
      });

      client.on('user-left', () => {
        console.log('User left');
        endCall();
      });

      setCallStarted(true);
      setError(null);
    } catch (e: any) {
      console.error('Agora error:', e);
      // Fallback to simple WebRTC
      setError('Используем WebRTC...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallStarted(true);
        setError(null);
      } catch (err: any) {
        setError('Ошибка: ' + e.message);
      }
    }
  };

  const initAgoraCall = async (callId: string) => {
    // This is now handled by startAgoraCall
  };

  const formatDuration = (seconds: number) => {
      
      // Channel name = call ID
      await client.join(APP_ID, callId, null, user?.id);
      
      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = [audioTrack, videoTrack];
      
      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      // Publish local tracks
      await client.publish(localTracksRef.current);
      
      // Handle remote users
      client.on('user-published', async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
          }
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      client.on('user-left', (user: any) => {
        console.log('User left:', user.uid);
        endCall();
      });

      setCallStarted(true);
      setError(null);
    } catch (e: any) {
      console.error('Agora init error:', e);
      setError('Ошибка: ' + e.message);
    }
  };

  const endCall = async () => {
    // Leave Agora
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (e) {}
    }
    
    // Stop local tracks
    localTracksRef.current.forEach((track: any) => {
      try {
        track.stop();
        track.close();
      } catch (e) {}
    });
    localTracksRef.current = [];

    // Update call status
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
    router.push('/dashboard');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    initCamera();

    return () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  const generateIcebreaker = () => {
    const ICEBREAKERS = [
      "Расскажи о своём самом необычном путешествии.",
      "Если бы ты мог жить в любой эпохе, какую бы выбрал?",
      "Какой навык ты хотел бы освоить за неделю?",
      "Что тебя больше всего рассмешило в последнее время?",
      "Если бы ты мог dinner с любым историческим персонажем?",
      "Какой твой любимый фильм и почему именно он?",
      "Что ты делаешь, когда не можешь заснуть?",
      "Расскажи о своём питомце или о том, какой бы ты хотел.",
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
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={partnerImg} 
            alt="Видео партнера" 
            className="w-64 h-64 object-cover rounded-full blur-[2px]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        
        {!callStarted ? (
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold font-headline">{loadingPartner ? 'Загрузка...' : partnerData?.full_name || 'Пользователь'}</h2>
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

            {callingTo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Звоним...</span>
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setCallingTo(false);
                    setCallStatus(null);
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

            {localVideoRef.current?.srcObject && !callStarted && !callingTo && (
              <div className="w-32 aspect-[3/4] glass rounded-2xl overflow-hidden border-2 border-white/10 mx-auto">
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-primary/20 text-xs font-semibold text-primary uppercase">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Соединение
              </div>
              <h2 className="text-4xl font-bold font-headline">{loadingPartner ? 'Загрузка...' : partnerData?.full_name || 'Пользователь'}</h2>
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

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

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