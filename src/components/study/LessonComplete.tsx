"use client";

import { useLessonProgress } from "@/lib/progress";

export function LessonComplete({ num }: { num: string }) {
  const { isDone, toggle } = useLessonProgress();
  const done = isDone(num);
  return (
    <button
      type="button"
      onClick={() => toggle(num)}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
        done
          ? "border border-green bg-green-light text-green-dark"
          : "bg-green text-on-green hover:bg-green-dark"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {done ? "Урок пройден" : "Отметить пройденным"}
    </button>
  );
}
