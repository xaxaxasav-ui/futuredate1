"use client";

import { useState, useEffect, useRef } from "react";

import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const COUNTRY_CODES = [
  { code: "+7", country: "Россия", mask: "(___) ___-__-__" },
  { code: "+375", country: "Беларусь", mask: "(___) ___-__-__" },
  { code: "+380", country: "Украина", mask: "(___) ___-__-__" },
  { code: "+996", country: "Кыргызстан", mask: "(___) ___-__-__" },
  { code: "+998", country: "Узбекистан", mask: "(___) ___-__-__" },
  { code: "+993", country: "Туркменистан", mask: "(___) __-__-__" },
  { code: "+992", country: "Таджикистан", mask: "(___) ___-__-__" },
  { code: "+77", country: "Казахстан", mask: "(___) ___-__-__" },
];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const defaultTab = searchParams.get("tab") || "signin";
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToOffer, setAgreedToOffer] = useState(false);
  const [agreedToProcessing, setAgreedToProcessing] = useState(false);

  const canRegister = agreedToTerms && agreedToPrivacy && agreedToOffer && agreedToProcessing;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const mask = selectedCountryCode.mask;
    let result = '';
    let digitIndex = 0;
    
    for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
      if (mask[i] === '_') {
        result += digits[digitIndex];
        digitIndex++;
      } else {
        result += mask[i];
      }
    }
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setSignupPhone(formatted);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Attempting sign in with:", loginEmail);
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Full error:", error);
      let message = error.message || "Неизвестная ошибка";
      if (message.includes("Failed to fetch") || message.includes("fetch")) {
        message = "Не удалось连接到 серверу. Проверьте интернет-соединение.";
      }
      toast({
        title: "Ошибка входа",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting sign up with:", signupEmail);

    if (honeypotRef.current?.value) {
      console.log("Bot detected");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (!canRegister) {
      toast({
        title: "Ошибка",
        description: "Необходимо согласиться со всеми условиями",
        variant: "destructive",
      });
      return;
    }

    if (signupPhone.length < 10) {
      toast({
        title: "Ошибка",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${selectedCountryCode.code}${signupPhone.replace(/\D/g, '')}`;
      
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { 
            name: signupName,
            phone: fullPhone,
          },
        },
      });
      if (error) throw error;
      
      toast({
        title: "Успешно",
        description: "Проверьте email для подтверждения",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative pt-24 pb-12 px-6 overflow-hidden">
      
      
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold font-headline">Добро пожаловать в будущее</h1>
          <p className="text-muted-foreground">AI-знакомства нового поколения</p>
        </div>

        <GlassCard className="p-8">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    className="glass"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? "text" : "password"} 
                      className="glass pr-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full neo-glow"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Войти
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Имя <span className="text-destructive">*</span></Label>
                  <Input 
                    id="signup-name" 
                    placeholder="Ваше имя" 
                    className="glass"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    className="glass"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Телефон <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCountryCode.code}
                      onChange={(e) => setSelectedCountryCode(COUNTRY_CODES.find(c => c.code === e.target.value) || COUNTRY_CODES[0])}
                      className="glass rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {COUNTRY_CODES.map(cc => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} ({cc.country})
                        </option>
                      ))}
                    </select>
                    <Input 
                      type="tel"
                      placeholder={selectedCountryCode.mask}
                      className="glass flex-1"
                      value={signupPhone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Пароль <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? "text" : "password"} 
                      className="glass pr-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Минимум 8 символов</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Подтверждение пароля <span className="text-destructive">*</span></Label>
                  <Input 
                    id="signup-confirm-password" 
                    type="password" 
                    className="glass"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">Согласия <span className="text-destructive">*</span></p>
                  
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="agree-terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label htmlFor="agree-terms" className="text-sm text-muted-foreground leading-tight">
                      Я согласен с <Link href="/legal/terms" target="_blank" className="text-primary hover:underline">Правилами сервиса</Link> <span className="text-destructive">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="agree-privacy" 
                      checked={agreedToPrivacy}
                      onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                    />
                    <label htmlFor="agree-privacy" className="text-sm text-muted-foreground leading-tight">
                      Я согласен с <Link href="/legal/privacy" target="_blank" className="text-primary hover:underline">Политикой конфиденциальности</Link> <span className="text-destructive">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="agree-offer" 
                      checked={agreedToOffer}
                      onCheckedChange={(checked) => setAgreedToOffer(checked as boolean)}
                    />
                    <label htmlFor="agree-offer" className="text-sm text-muted-foreground leading-tight">
                      Я согласен с <Link href="/legal/offer" target="_blank" className="text-primary hover:underline">Офертой на оказание услуг</Link> <span className="text-destructive">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="agree-processing" 
                      checked={agreedToProcessing}
                      onCheckedChange={(checked) => setAgreedToProcessing(checked as boolean)}
                    />
                    <label htmlFor="agree-processing" className="text-sm text-muted-foreground leading-tight">
                      Я даю согласие на обработку персональных данных в соответствии с ФЗ №152-ФЗ <span className="text-destructive">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="agree-consent" 
                      checked={agreedToTerms && agreedToPrivacy}
                      onCheckedChange={(checked) => {
                        setAgreedToTerms(checked as boolean);
                        setAgreedToPrivacy(checked as boolean);
                        setAgreedToOffer(checked as boolean);
                        setAgreedToProcessing(checked as boolean);
                      }}
                    />
                    <label htmlFor="agree-consent" className="text-sm text-muted-foreground leading-tight">
                      Я прочитал и согласен со всеми документами
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-full neo-glow"
                  disabled={isLoading || !canRegister}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Создать аккаунт
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Защищено AI-верификацией</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
