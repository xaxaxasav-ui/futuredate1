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

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
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

  useEffect(() => {
    if (partnerId && user) {
      const interval = setInterval(checkForIncomingCalls, 3000);
      return () => clearInterval(interval);
    }
  }, [partnerId, user]);

  const checkForIncomingCalls = async () => {
    if (!partnerId || !user) return;
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('caller_id', partnerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        setIncomingCall(data);
        setCurrentCallId(data.id);
      }
    } catch (e) {}
  };

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
    
    console.log('Initiating call to', partnerId);
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

      console.log('Call created - data:', JSON.stringify(call), 'error:', error);
      
      if (error || !call) {
        console.error('Failed to create call, error:', error);
        alert('Ошибка при создании звонка: ' + (error?.message || 'unknown'));
        setCallingTo(false);
        setCallStatus(null);
        return;
      }

      setCurrentCallId(call.id);
      console.log('Call ID set to:', call.id);

      console.log('Creating notification for', partnerId);
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
          startWebRTC();
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
          alert('Абонент не отвечает. Попробуйте позже.');
        }
      }, 30000);
    } catch (e) {
      console.error('Error initiating call:', e);
      setError('Ошибка при звонке');
      setCallingTo(false);
      setCallStatus(null);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !user) return;
    
    await supabase
      .from('calls')
      .update({ status: 'accepted' })
      .eq('id', incomingCall.id);
    
    setIncomingCall(null);
    setCallStatus('connected');
    startWebRTC();
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    await supabase
      .from('calls')
      .update({ status: 'declined' })
      .eq('id', incomingCall.id);
    setIncomingCall(null);
  };

  const startWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      setCallStarted(true);
      setError(null);
    } catch (e: any) {
      console.error('Error starting call:', e);
      setError('Не удалось получить доступ к камере: ' + e.message);
    }
  };

  const endCall = async () => {
    if (currentCallId) {
      await supabase
        .from('calls')
        .update({ status: 'completed' })
        .eq('id', currentCallId);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
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
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    initCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, localStream]);

  const generateIcebreaker = () => {
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
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <GlassCard className="p-8 max-w-md text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <PhoneIncoming className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Входящий звонок!</h3>
              <p className="text-muted-foreground mt-2">
                {partnerData?.full_name || 'Пользователь'} звонит вам
              </p>
            </div>
            {localStream && (
              <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white/10 mx-auto">
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button 
                variant="destructive" 
                size="lg"
                className="rounded-full px-8"
                onClick={declineCall}
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Отклонить
              </Button>
              <Button 
                className="rounded-full px-8 neo-glow"
                size="lg"
                onClick={acceptCall}
              >
                <Phone className="w-5 h-5 mr-2" />
                Принять
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

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

            {localStream && !callStarted && !callingTo && (
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

            {localStream && (
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
            )}

            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={partnerImg} 
                  alt="Ожидание видео..." 
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
                <div className="relative z-10 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg">Ожидание подключения партнёра...</p>
                </div>
              </div>
            )}

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