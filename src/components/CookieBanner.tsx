"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem("cookies_accepted");
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookies_accepted", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <GlassCard className="p-4 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-center md:text-left">
            <p className="font-medium">Мы используем cookies</p>
            <p className="text-muted-foreground text-xs mt-1">
              Это помогает улучшать наш сервис. Продолжая использовать сайт, вы соглашаетесь с использованием cookies.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={acceptCookies}>
              Принять
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                localStorage.setItem("cookies_accepted", "false");
                setShowBanner(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
