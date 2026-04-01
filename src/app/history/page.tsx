"use client";

import { GlassCard } from "@/components/GlassCard";
import { Clock } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="min-h-screen pt-20 pb-6 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-3">
            <Clock className="w-8 h-8" />
            История
          </h1>
          <p className="text-muted-foreground">Просмотренные профили и действия</p>
        </div>

        <GlassCard className="p-12 text-center">
          <Clock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">История пуста</h3>
          <p className="text-muted-foreground">
            Здесь будет отображаться история ваших просмотров и действий.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
