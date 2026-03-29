
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export function GlassCard({ children, className, variant = "light" }: GlassCardProps) {
  return (
    <div className={cn(
      variant === "light" ? "glass" : "glass-dark",
      "rounded-2xl",
      className
    )}>
      {children}
    </div>
  );
}
