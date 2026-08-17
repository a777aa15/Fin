"use client";

// Единый провайдер авторизации и прогресса.
// Залогиненные: прогресс в БД через /api/progress. Гости: localStorage.
// При входе гостевой прогресс автоматически переносится в аккаунт.
// Хуки useLessonProgress/useQuizResults/useCaseResults сохраняют прежний API —
// страницы и компоненты менять не нужно.

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type SessionUser = { id: string; email: string; name: string | null };
export type QuizResult = { score: number; total: number };
export type CaseResult = {
  found: number;
  totalFlags: number;
  falsePositives: number;
  verdictCorrect: boolean;
};

type Snapshot = {
  lessons: Set<string>;
  quizzes: Record<string, QuizResult>;
  cases: Record<string, CaseResult>;
};

type Ctx = {
  user: SessionUser | null;
  loaded: boolean;
  lessons: Set<string>;
  quizzes: Record<string, QuizResult>;
  cases: Record<string, CaseResult>;
  toggleLesson: (num: string) => void;
  setLessonDone: (num: string, done: boolean) => void;
  setQuiz: (moduleN: number, r: QuizResult) => void;
  setCase: (moduleN: number, r: CaseResult) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

// ---------- localStorage (гостевой режим) ----------
const LS_LESSONS = "fa-progress-lessons-v1";
const LS_QUIZ = "fa-progress-quiz-v1";
const LS_CASE = "fa-progress-case-v1";

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
function readGuest(): Snapshot {
  return {
    lessons: new Set(lsRead<string[]>(LS_LESSONS, [])),
    quizzes: lsRead<Record<string, QuizResult>>(LS_QUIZ, {}),
    cases: lsRead<Record<string, CaseResult>>(LS_CASE, {}),
  };
}
function clearGuest() {
  [LS_LESSONS, LS_QUIZ, LS_CASE].forEach((k) => localStorage.removeItem(k));
}

async function postProgress(body: unknown) {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* оффлайн — состояние уже обновлено оптимистично */
  }
}

// ---------- Провайдер ----------
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [lessons, setLessons] = useState<Set<string>>(new Set());
  const [quizzes, setQuizzes] = useState<Record<string, QuizResult>>({});
  const [cases, setCases] = useState<Record<string, CaseResult>>({});

  const applySnapshot = useCallback((s: Snapshot) => {
    setLessons(s.lessons);
    setQuizzes(s.quizzes);
    setCases(s.cases);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      if (data.user) {
        // Перенос гостевого прогресса в аккаунт (однократно при наличии)
        const guest = readGuest();
        const hasGuest = guest.lessons.size > 0 || Object.keys(guest.quizzes).length > 0 || Object.keys(guest.cases).length > 0;
        let progress = data.progress;
        if (hasGuest) {
          const imp = await fetch("/api/progress/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessons: [...guest.lessons],
              quizzes: guest.quizzes,
              cases: guest.cases,
            }),
          });
          const impData = await imp.json();
          if (impData.progress) progress = impData.progress;
          clearGuest();
        }
        setUser(data.user);
        applySnapshot({
          lessons: new Set<string>(progress?.lessons ?? []),
          quizzes: progress?.quizzes ?? {},
          cases: progress?.cases ?? {},
        });
      } else {
        setUser(null);
        applySnapshot(readGuest());
      }
    } catch {
      setUser(null);
      applySnapshot(readGuest());
    } finally {
      setLoaded(true);
    }
  }, [applySnapshot]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }, [refresh]);

  const setLessonDone = useCallback(
    (num: string, done: boolean) => {
      setLessons((prev) => {
        const next = new Set(prev);
        if (done) next.add(num);
        else next.delete(num);
        if (user) postProgress({ kind: "lesson", num, done });
        else lsWrite(LS_LESSONS, [...next]);
        return next;
      });
    },
    [user]
  );

  const toggleLesson = useCallback(
    (num: string) => setLessonDone(num, !lessons.has(num)),
    [lessons, setLessonDone]
  );

  const setQuiz = useCallback(
    (moduleN: number, r: QuizResult) => {
      setQuizzes((prev) => {
        const key = String(moduleN);
        const cur = prev[key];
        if (cur && cur.score >= r.score) return prev; // храним лучший
        const next = { ...prev, [key]: r };
        if (user) postProgress({ kind: "quiz", moduleN, score: r.score, total: r.total });
        else lsWrite(LS_QUIZ, next);
        return next;
      });
    },
    [user]
  );

  const setCase = useCallback(
    (moduleN: number, r: CaseResult) => {
      setCases((prev) => {
        const next = { ...prev, [String(moduleN)]: r };
        if (user)
          postProgress({
            kind: "case",
            moduleN,
            found: r.found,
            totalFlags: r.totalFlags,
            falsePositives: r.falsePositives,
            verdictCorrect: r.verdictCorrect,
          });
        else lsWrite(LS_CASE, next);
        return next;
      });
    },
    [user]
  );

  const value: Ctx = {
    user,
    loaded,
    lessons,
    quizzes,
    cases,
    toggleLesson,
    setLessonDone,
    setQuiz,
    setCase,
    refresh,
    logout,
  };

  return createElement(ProgressContext.Provider, { value }, children);
}

function useCtx(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress вне ProgressProvider");
  return ctx;
}

// ---------- Публичные хуки (совместимы с прежним API) ----------
export function useAuth() {
  const { user, loaded, refresh, logout } = useCtx();
  return { user, loaded, refresh, logout };
}

export function useLessonProgress() {
  const { lessons, toggleLesson, setLessonDone } = useCtx();
  return {
    done: lessons,
    isDone: (num: string) => lessons.has(num),
    toggle: toggleLesson,
    setDone: setLessonDone,
  };
}

export function useQuizResults() {
  const { quizzes, setQuiz } = useCtx();
  return {
    map: quizzes,
    get: (moduleN: number): QuizResult | undefined => quizzes[String(moduleN)],
    set: setQuiz,
  };
}

export function useCaseResults() {
  const { cases, setCase } = useCtx();
  return {
    map: cases,
    get: (moduleN: number): CaseResult | undefined => cases[String(moduleN)],
    set: setCase,
  };
}
