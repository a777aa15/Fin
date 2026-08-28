import type { Block } from "@/content/course";
import type { ReactNode } from "react";

// Рендер структурированного контента урока/доп-материала.
// Соседние bullet/numbered группируются в списки (как renderBlocks в прототипе).

export function LessonBlocks({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const b = blocks[i];

    if (b.type === "bullet") {
      const run: Extract<Block, { type: "bullet" }>[] = [];
      while (i < blocks.length && blocks[i].type === "bullet") {
        run.push(blocks[i] as Extract<Block, { type: "bullet" }>);
        i++;
      }
      out.push(<BulletList key={`b${i}`} items={run} />);
      continue;
    }

    if (b.type === "numbered") {
      const run: string[] = [];
      while (i < blocks.length && blocks[i].type === "numbered") {
        run.push((blocks[i] as Extract<Block, { type: "numbered" }>).text);
        i++;
      }
      out.push(
        <ol key={`n${i}`}>
          {run.map((t, k) => (
            <li key={k}>{t}</li>
          ))}
        </ol>
      );
      continue;
    }

    switch (b.type) {
      case "h3":
        out.push(<h3 key={`h${i}`}>{b.text}</h3>);
        break;
      case "p":
        out.push(<p key={`p${i}`}>{b.text}</p>);
        break;
      case "table":
        out.push(<BlockTable key={`t${i}`} headers={b.headers} rows={b.rows} />);
        break;
      case "links":
        out.push(
          <ul key={`l${i}`} className="!mt-3">
            {b.items.map((it, k) => (
              <li key={k}>
                <a href={it.url} target="_blank" rel="noopener noreferrer">
                  {it.text}
                </a>
              </li>
            ))}
          </ul>
        );
        break;
    }
    i++;
  }

  return <div className="lesson-content">{out}</div>;
}

// Шаг расчётной цепочки: «– Себестоимость продаж = Валовая прибыль».
// В тексте курса это единственный способ показать формулу «сверху вниз»
// (P&L и подобное), но ведущее тире визуально сливается с маркером списка —
// непонятно, что именно вычитается. Такие строки распознаём и рендерим
// отдельным компонентом с явным «−», вычитаемым и результатом.
const WATERFALL_STEP = /^[–-]\s*(.+?)\s*=\s*(.+)$/;

// Вложенные маркированные списки по полю level (0 / 1+).
function BulletList({ items }: { items: Extract<Block, { type: "bullet" }>[] }) {
  // Цепочка «база, затем один или несколько шагов вычитания» — узнаваемый
  // паттерн курса (P&L и т.п.). Рендерим наглядным блоком вместо списка.
  if (items.length >= 2 && items.every((it) => (it.level ?? 0) === 0)) {
    const [first, ...rest] = items;
    const firstIsBase = !WATERFALL_STEP.test(first.text) && !/^[–-]\s*/.test(first.text);
    const steps = rest.map((it) => it.text.match(WATERFALL_STEP));
    if (firstIsBase && steps.every((m) => m !== null)) {
      return (
        <div className="lesson-waterfall">
          <div className="lesson-waterfall-base">{first.text}</div>
          {steps.map((m, k) => (
            <div className="lesson-waterfall-step" key={k}>
              <span className="lesson-waterfall-op">−</span>
              <span className="lesson-waterfall-item">{m![1]}</span>
              <span className="lesson-waterfall-eq">=</span>
              <span className="lesson-waterfall-result">{m![2]}</span>
            </div>
          ))}
        </div>
      );
    }
  }

  const nodes: ReactNode[] = [];
  let k = 0;
  while (k < items.length) {
    const it = items[k];
    const level = it.level ?? 0;
    if (level === 0) {
      // собрать вложенные (level>0), идущие следом
      const children: string[] = [];
      let j = k + 1;
      while (j < items.length && (items[j].level ?? 0) > 0) {
        children.push(items[j].text);
        j++;
      }
      nodes.push(
        <li key={k}>
          {it.text}
          {children.length > 0 ? (
            <ul>
              {children.map((c, ci) => (
                <li key={ci}>{c}</li>
              ))}
            </ul>
          ) : null}
        </li>
      );
      k = j;
    } else {
      // вложенный без родителя — на верхний уровень
      nodes.push(<li key={k}>{it.text}</li>);
      k++;
    }
  }
  return <ul>{nodes}</ul>;
}

function BlockTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="lesson-table-wrap">
      <table className="lesson-table">
        {headers && headers.length > 0 ? (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
