"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/progress";

// После авторизации лендинг не показывается — сразу открывается курс.
export function RedirectIfAuthed({ to = "/study" }: { to?: string }) {
  const router = useRouter();
  const { user, loaded } = useAuth();

  useEffect(() => {
    if (loaded && user) router.replace(to);
  }, [loaded, user, router, to]);

  return null;
}
