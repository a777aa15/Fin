// Типизированный доступ к контенту курса «Финансовый аналитик».
// Данные извлечены из прототипа в src/content/data/*.json
// (см. scripts/extract-content.mjs). Импортируются в серверных компонентах.

import courseData from "./data/course.json";
import quizData from "./data/quiz.json";
import detectiveData from "./data/detective.json";
import glossaryData from "./data/glossary.json";

// ---------- Типы контентных блоков урока ----------
export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; text: string; level?: number }
  | { type: "numbered"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "links"; items: { text: string; url: string }[] };

export type Lesson = {
  num: string; // "0.1"
  tag?: string | null;
  title: string;
  blocks: Block[];
};

export type Extra = {
  title: string;
  blocks: Block[];
};

export type Module = {
  n: number; // 0..14
  short: string;
  subtitle: string;
  intro: string;
  lessons: Lesson[];
  extras: Extra[];
};

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  explain: string;
};
export type Quiz = { module: number; questions: QuizQuestion[] };

export type DetectiveStatement = {
  id: string;
  text: string;
  isFlag: boolean;
  explain: string;
};
export type DetectiveDocument = {
  id: string;
  title: string;
  type: string;
  statements: DetectiveStatement[];
};
export type DetectiveVerdictOption = {
  text: string;
  correct: boolean;
  explain: string;
};
export type DetectiveCase = {
  module: number;
  title: string;
  company: string;
  role: string;
  briefing: string;
  documents: DetectiveDocument[];
  verdictQuestion: string;
  verdictOptions: DetectiveVerdictOption[];
  id: string;
  totalFlags: number;
  totalStatements: number;
};

export type GlossaryTerm = { category: string; term: string; def: string };

// ---------- Данные ----------
export const modules = courseData as unknown as Module[];
export const quizzes = quizData as unknown as Quiz[];
export const cases = detectiveData as unknown as DetectiveCase[];
export const glossary = glossaryData as unknown as GlossaryTerm[];

// Плоский список уроков с ссылкой на модуль — для навигации и /lesson/[num].
export type FlatLesson = { lesson: Lesson; module: Module; index: number };
export const flatLessons: FlatLesson[] = modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ lesson, module, index: 0 }))
);
flatLessons.forEach((fl, i) => (fl.index = i));

export const totalLessons = flatLessons.length;

// ---------- Хелперы ----------
export function getModule(n: number): Module | undefined {
  return modules.find((m) => m.n === n);
}

export function getLessonByNum(num: string): FlatLesson | undefined {
  return flatLessons.find((fl) => fl.lesson.num === num);
}

export function getPrevNext(num: string): {
  prev: Lesson | null;
  next: Lesson | null;
} {
  const idx = flatLessons.findIndex((fl) => fl.lesson.num === num);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? flatLessons[idx - 1].lesson : null,
    next: idx < flatLessons.length - 1 ? flatLessons[idx + 1].lesson : null,
  };
}

export function getQuiz(moduleN: number): Quiz | undefined {
  return quizzes.find((q) => q.module === moduleN);
}

export function getCase(moduleN: number): DetectiveCase | undefined {
  return cases.find((c) => c.module === moduleN);
}

export function glossaryCategories(): string[] {
  return [...new Set(glossary.map((g) => g.category))];
}

// Итоговые агрегаты курса (для лендинга и обзора).
export const courseFacts = {
  modules: modules.length,
  lessons: totalLessons,
  quizQuestions: quizzes.reduce((s, q) => s + q.questions.length, 0),
  cases: cases.length,
  glossaryTerms: glossary.length,
  calculators: 6,
};
