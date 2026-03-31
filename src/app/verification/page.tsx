"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";

export default function VerificationPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useSupabase();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showContent, setShowContent] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setShowContent(true);
    }
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Show demo by default
  useEffect(() => {
    setShowDemo(true);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Не удалось включить камеру. Проверьте разрешения.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCurrentUrl(photoDataUrl);
        // Convert to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
          }
        }, 'image/jpeg', 0.8);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      const newUrl = URL.createObjectURL(file);
      setCurrentUrl(newUrl);
      setSelectedFile(file);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleReset = () => {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      setCurrentUrl("");
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Convert image to base64 for storage without bucket
      const reader = new FileReader();
      reader.onload = async (e) => {
        let base64 = e.target?.result as string;
        
        // Compress image if too large (max 500KB for Supabase)
        if (base64.length > 500000) {
          const img = new Image();
          img.src = base64;
          await new Promise(resolve => { img.onload = resolve; });
          
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
          else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          base64 = canvas.toDataURL('image/jpeg', 0.7);
        }
        
        console.log('Base64 length:', base64.length);
        console.log('User ID:', user.id);
        
        try {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          console.log('Saving verification photo...');
          if (existingProfile) {
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ 
                verification_photo: base64,
                verification_status: 'pending'
              })
              .eq('id', user.id);
            console.log('Update result:', updateData, 'error:', updateError);
            if (!updateError) {
              console.log('Verification photo saved, starting AI verification...');
              
              // AI verification simulation
              setTimeout(async () => {
                // AI checks the photo (simulated)
                const aiResult = Math.random() > 0.3; // 70% success rate
                
                await supabase
                  .from('profiles')
                  .update({ 
                    is_verified: aiResult,
                    verification_status: aiResult ? 'approved' : 'rejected'
                  })
                  .eq('id', user.id);
                
                await refreshProfile();
                
                if (aiResult) {
                  alert('🎉 Поздравляем! Ваша верификация прошла успешно! Вы верифицированы.');
                } else {
                  alert('😔 К сожалению, верификация не прошла. Попробуйте загрузить другое фото.');
                }
              }, 3000);
            }
          } else {
            // Create profile if not exists
            await supabase
              .from('profiles')
              .insert({ 
                id: user.id,
                verification_photo: base64,
                verification_status: 'pending'
              });
            
            // AI verification simulation
            setTimeout(async () => {
              const aiResult = Math.random() > 0.3;
              await supabase
                .from('profiles')
                .update({ 
                  is_verified: aiResult,
                  verification_status: aiResult ? 'approved' : 'rejected'
                })
                .eq('id', user.id);
              await refreshProfile();
            }, 3000);
          }

          await refreshProfile();
          
          // Simulate verification check
          setTimeout(async () => {
            const isValid = Math.random() > 0.3;
            await supabase
              .from('profiles')
              .update({ 
                is_verified: isValid,
                verification_status: isValid ? 'approved' : 'rejected'
              })
              .eq('id', user.id);
            await refreshProfile();
            setSubmitted(true);
          }, 3000);
        } catch (error) {
          console.error('Error saving verification:', error);
          alert('Ошибка при сохранении: ' + JSON.stringify(error));
          setUploading(false);
        }
      };
      reader.onerror = () => {
        alert('Ошибка при чтении файла');
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error:', error);
      alert('Произошла ошибка. Попробуйте ещё раз.');
      setUploading(false);
    }
  };

  if (authLoading && !showContent) {
    return (
      <div className="min-h-screen relative pt-24 pb-12 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isVerified = profile?.is_verified === true;
  const status = profile?.verification_status;

  // Demo content matching the HTML design
  const DemoContent = () => (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-headline">Верификация профиля</h1>
          <p className="text-sm text-muted-foreground">Сделайте реальное селфи прямо сейчас</p>
        </div>
      </div>

      {/* Notice */}
      <div 
        className="flex gap-3 p-4 rounded-2xl mb-6 bg-amber-500/10 border border-amber-500/30"
      >
        <span className="text-xl">⚠️</span>
        <div className="text-sm text-foreground">
          Фото должно быть <b>настоящим селфи</b>. Нельзя использовать картинку, фото с другого телефона, снимок экрана, распечатку, аватар или изображение с фильтрами.
        </div>
      </div>

      {/* Photo Example */}
      <GlassCard className="p-5 mb-6">
        <h3 className="font-bold text-lg mb-4 text-foreground">Пример правильного селфи</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Correct example with real photo + gesture overlay */}
          <div className="relative rounded-2xl overflow-hidden" 
               style={{ 
                 aspectRatio: '3/4',
                 border: '1px solid #f2d9e5'
               }}>
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop"
              alt="Пример селфи для верификации"
              className="w-full h-full object-cover"
            />
            {/* Gesture overlay */}
            <div 
              className="absolute text-5xl z-20"
              style={{ 
                right: '8%',
                top: '35%',
                transform: 'rotate(-8deg)',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.3))'
              }}
            >
              ✌️
            </div>
            {/* OK badge */}
            <div 
              className="absolute px-3 py-1 rounded-full text-white text-sm font-bold z-30"
              style={{ 
                top: '12px', 
                right: '12px', 
                background: '#22c55e',
                boxShadow: '0 10px 22px rgba(34,197,94,.28)'
              }}
            >
              ✔ Верно
            </div>
            {/* Hint chip */}
            <div 
              className="absolute px-3 py-2 rounded-full text-sm font-bold z-30"
              style={{ 
                left: '12px',
                bottom: '12px',
                background: 'rgba(255,255,255,.95)',
                color: '#111827',
                border: '1px solid #f0d6e2',
                boxShadow: '0 4px 12px rgba(0,0,0,.1)'
              }}
            >
              Повторите жест ✌️
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold mb-3 text-foreground">Что должно быть на фото</h4>
              <ul className="space-y-2">
                {[
                  { icon: '✓', color: 'bg-green-500/20 text-green-400', text: 'Реальное селфи, сделанное сейчас камерой' },
                  { icon: '✓', color: 'bg-green-500/20 text-green-400', text: 'Лицо полностью видно без теней' },
                  { icon: '✓', color: 'bg-green-500/20 text-green-400', text: 'Повторите жест ✌️ рядом с лицом' },
                  { icon: '✓', color: 'bg-green-500/20 text-green-400', text: 'Без фильтров, масок и ретуши' },
                  { icon: '✓', color: 'bg-green-500/20 text-green-400', text: 'Смотрите в камеру, снимок чёткий' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-3 text-foreground">Что не подходит</h4>
              <ul className="space-y-2">
                {[
                  { icon: '✕', color: 'bg-red-500/20 text-red-400', text: 'Фото экрана, снимок с другого телефона' },
                  { icon: '✕', color: 'bg-red-500/20 text-red-400', text: 'Картинка, иллюстрация, аватар' },
                  { icon: '✕', color: 'bg-red-500/20 text-red-400', text: 'Солнцезащитные очки, маска, фильтры' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-muted-foreground">
          Пример: лицо полностью в кадре, нейтральный фон, хорошее освещение, живая фотография и жест <b>✌️</b> рядом с лицом.
        </p>
      </GlassCard>

      {/* Instructions Steps */}
      <GlassCard className="p-5 mb-6">
        <h3 className="font-bold text-lg mb-4 text-foreground">📝 Инструкция</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <p className="text-sm text-foreground">Откройте фронтальную камеру и найдите место с хорошим светом.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <p className="text-sm text-foreground">Убедитесь, что ваше лицо полностью видно и находится по центру кадра.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <p className="text-sm text-foreground">Поднимите руку и покажите жест <b>✌️</b> рядом с лицом, как в примере.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
            <p className="text-sm text-foreground">Сделайте <b>реальное селфи</b>. Не фотографируйте картинку, экран или старую фотографию.</p>
          </div>
        </div>
      </GlassCard>

      {/* Camera or Photo Preview */}
      {currentUrl ? (
        <GlassCard className="p-4">
          <p className="text-sm text-center mb-3">Ваше селфи:</p>
          <img src={currentUrl} alt="Selfie" className="w-full rounded-xl" />
          <div className="flex gap-2 mt-3">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Переснять
            </Button>
            <Button onClick={handleSubmit} disabled={uploading} className="flex-1 neo-glow">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '✅ Отправить'}
            </Button>
          </div>
        </GlassCard>
      ) : cameraActive ? (
        <GlassCard className="p-0 overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full aspect-[3/4] object-cover"
          />
          <div className="p-4 flex justify-center">
            <Button onClick={takePhoto} size="lg" className="rounded-full w-20 h-20 bg-white text-primary border-4 border-primary">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white" />
              </div>
            </Button>
          </div>
          <Button variant="outline" onClick={stopCamera} className="w-full rounded-b-xl">
            Отмена
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            disabled={uploading || status === 'pending'}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-base hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading || status === 'pending' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Загрузка...
              </>
            ) : (
              '📸 Сделать селфи'
            )}
          </button>
          <Link href="/profile" className="block">
            <button className="w-full py-3 bg-slate-100 text-gray-600 rounded-xl text-sm">
              Отложить на потом
            </button>
          </Link>
        </div>
      )}

      {/* Success */}
      {submitted && (
        <div className="mt-5 p-6 bg-green-100 rounded-2xl border border-green-300 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-bold text-green-800">Фото отправлено!</p>
          <p className="text-sm text-green-600 mt-1">Мы проверим его в ближайшее время</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-3">
      
      {showDemo ? <DemoContent /> : (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Верификация</h1>
          </div>
          <p>Загрузка...</p>
        </div>
      )}
    </div>
  );
}