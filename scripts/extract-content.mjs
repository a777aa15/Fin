// Извлекает контент курса из прототипа docs/source/course-app_2.html
// в JSON-файлы src/content/data/*.json.
// Запуск:  node scripts/extract-content.mjs
//
// Источники внутри HTML:
//  - <script id="course-data" type="application/json">     → course.json
//  - <script id="quiz-data" type="application/json">        → quiz.json
//  - <script id="detective-data" type="application/json">   → detective.json
//  - const GLOSSARY_DATA = [ ... ] (JS-литерал)             → glossary.json

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcPath = join(root, "docs/source/course-app_2.html");
const outDir = join(root, "src/content/data");
mkdirSync(outDir, { recursive: true });

const html = readFileSync(srcPath, "utf8");

function extractJsonScript(id) {
  const re = new RegExp(
    `<script id="${id}" type="application/json">([\\s\\S]*?)</script>`
  );
  const m = html.match(re);
  if (!m) throw new Error(`script #${id} not found`);
  return JSON.parse(m[1].trim());
}

// Сканер сбалансированных скобок, уважающий строки/кавычки (для JS-литерала глоссария).
function extractBalancedArray(marker) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`marker ${marker} not found`);
  const open = html.indexOf("[", start);
  let i = open,
    depth = 0,
    inStr = false,
    quote = "";
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quote) inStr = false;
    } else {
      if (ch === "'" || ch === '"' || ch === "`") {
        inStr = true;
        quote = ch;
      } else if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
  }
  return html.slice(open, i);
}

// --- course / quiz / detective (валидный JSON) ---
const course = extractJsonScript("course-data");
const quiz = extractJsonScript("quiz-data");
const detective = extractJsonScript("detective-data");

// --- glossary (JS-литерал → eval в билд-скрипте, источник доверенный) ---
const glossaryLiteral = extractBalancedArray("GLOSSARY_DATA");
// eslint-disable-next-line no-eval
const glossaryGrouped = eval("(" + glossaryLiteral + ")");
// Плоский список: { category, term, def }
const glossary = [];
for (const group of glossaryGrouped) {
  for (const t of group.terms) {
    glossary.push({ category: group.cat, term: t.term, def: t.def });
  }
}

// Обогащаем курс slug'ами уроков (num → id для URL, точку меняем на дефис не нужно —
// используем num как есть в маршруте /lesson/[num]).
const totalLessons = course.reduce((s, m) => s + m.lessons.length, 0);

writeFileSync(join(outDir, "course.json"), JSON.stringify(course));
writeFileSync(join(outDir, "quiz.json"), JSON.stringify(quiz));
writeFileSync(join(outDir, "detective.json"), JSON.stringify(detective));
writeFileSync(join(outDir, "glossary.json"), JSON.stringify(glossary, null, 2));

// Краткий индекс модулей для быстрых списков/оглавления (без тяжёлых blocks).
const modulesIndex = course.map((m) => ({
  n: m.n,
  short: m.short,
  subtitle: m.subtitle,
  intro: m.intro,
  lessonCount: m.lessons.length,
  lessons: m.lessons.map((l) => ({ num: l.num, title: l.title, tag: l.tag ?? null })),
  extrasCount: (m.extras || []).length,
}));
writeFileSync(join(outDir, "modules-index.json"), JSON.stringify(modulesIndex));

console.log("Извлечено:");
console.log(`  модулей:   ${course.length}`);
console.log(`  уроков:    ${totalLessons}`);
console.log(`  тестов:    ${quiz.length} наборов (${quiz.reduce((s, q) => s + q.questions.length, 0)} вопросов)`);
console.log(`  дел:       ${detective.length}`);
console.log(`  терминов:  ${glossary.length}`);
console.log(`Файлы записаны в src/content/data/`);
