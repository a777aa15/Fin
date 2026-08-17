"use client";

import type { ReactNode } from "react";

export const ENROLL_EVENT = "open-enroll";

export function openEnroll() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ENROLL_EVENT));
  }
}

export function EnrollButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button type="button" onClick={openEnroll} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}
