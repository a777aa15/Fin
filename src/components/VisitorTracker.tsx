"use client";

import { useEffect } from "react";

// Беакон посетителя: один раз за загрузку помечает уникальный визит (для конверсии).
export function VisitorTracker() {
  useEffect(() => {
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
