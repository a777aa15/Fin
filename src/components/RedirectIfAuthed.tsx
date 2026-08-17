"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/progress";

// После авторизации лендинг не показывается: одобренного — в курс, остальных — на страницу ожидания.
export function RedirectIfAuthed() {
  const router = useRouter();
  const { user, loaded } = useAuth();

  useEffect(() => {
    if (!loaded || !user) return;
    router.replace(user.approved ? "/study" : "/pending");
  }, [loaded, user, router]);

  return null;
}
