"use client";

import { ThemeProvider as OriginalThemeProvider } from "@/components/ThemeProvider";
import { ReactNode } from "react";

export function ClientThemeProvider({ children }: { children: ReactNode }) {
  return <OriginalThemeProvider>{children}</OriginalThemeProvider>;
}