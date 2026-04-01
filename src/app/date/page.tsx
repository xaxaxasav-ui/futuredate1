"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Sparkles, MessageCircle, Volume2, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSupabase } from "@/components/SupabaseProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { createNotification } from "@/lib/notifications";

const ICEBREAKERS = [
  "Что бы ты взяла с собой на обитаемую станцию?",
  "Если бы ты могла создать новый вид искусства, какой бы он был?",
  "Какой момент из будущего ты хотела бы пережить?",
  "О чем ты мечтаешь, глядя на звезды?",
  "Если бы мы оказались в виртуальной реальности, куда бы отправились?",
];

export default function VideoDatePage() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams?.get('user');
  
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStarted, setCallStarted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const partnerImg = PlaceHolderImages[1].imageUrl;
  const selfImg = PlaceHolderImages[4].imageUrl;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

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
        setError('Не удалось получить доступ к камере');
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateIcebreaker = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomIcebreaker = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
      setIcebreaker(randomIcebreaker);
      setIsGenerating(false);
    }, 1000);
  };

  const startCall = async () => {
    setCallStarted(true);
    
    if (partnerId && user) {
      createNotification({
        userId: partnerId,
        type: 'message',
        title: 'Видеосвидание началось! 🎥',
        message: `${user.user_metadata?.full_name || 'Пользователь'} приглашает вас на видеосвидание!`,
        fromUserId: user.id,
        fromUserName: user.user_metadata?.full_name || 'Пользователь',
        fromUserAvatar: user.user_metadata?.avatar_url || undefined,
        link: '/date'
      });
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    router.push('/dashboard');
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
        <img 
          src={partnerImg} 
          alt="Видео партнера" 
          className="absolute inset-0 w-full h-full object-cover blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        
        {!callStarted ? (
          <div className="relative z-10 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold font-headline">Елена</h2>
              <p className="text-muted-foreground">Ожидает начала видеосвидания</p>
            </div>
            
            {error && (
              <div className="text-destructive px-4 py-2 glass rounded-lg">
                {error}
              </div>
            )}

            <Button 
              onClick={startCall}
              className="rounded-full px-8 h-14 neo-glow text-lg"
            >
              <Video className="w-5 h-5 mr-2" />
              Начать свидание
            </Button>

            {localStream && (
              <div className="w-48 aspect-[3/4] glass rounded-2xl overflow-hidden border-2 border-white/10 mx-auto">
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
              <h2 className="text-4xl font-bold font-headline">Елена</h2>
            </div>

            {localStream && (
              <div className="absolute bottom-24 right-8 w-48 aspect-[3/4] glass rounded-2xl overflow-hidden border-2 border-white/10 group">
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
