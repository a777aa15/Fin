import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import { MentorWidget } from "@/components/mentor/MentorWidget";
import { NotesWidget } from "@/components/NotesWidget";
import { VisitorTracker } from "@/components/VisitorTracker";

export const metadata: Metadata = {
  title: {
    default: "Финансовый аналитик — курс с нуля до уверенного уровня",
    template: "%s · Финансовый аналитик",
  },
  description:
    "Онлайн-курс «Финансовый аналитик»: с нуля до уверенного уровня 1–3 года опыта. Бухучёт и отчётность, Excel, финмоделирование, DCF, оценка проектов, юнит-экономика. 148 уроков, тесты, калькуляторы, тренажёр «Финансовый детектив» и дипломная работа.",
  keywords: [
    "финансовый аналитик",
    "курс финансового анализа",
    "финансовое моделирование",
    "DCF",
    "оценка бизнеса",
    "Excel для финансиста",
    "юнит-экономика",
  ],
  openGraph: {
    title: "Финансовый аналитик — курс с нуля до уверенного уровня",
    description:
      "148 уроков, тесты, калькуляторы, тренажёр «Финансовый детектив» и дипломная работа. С нуля до junior-аналитика.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ProgressProvider>
          {children}
          <MentorWidget />
          <NotesWidget />
          <VisitorTracker />
        </ProgressProvider>
      </body>
    </html>
  );
}
