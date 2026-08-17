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

// Вложенные маркированные списки по полю level (0 / 1+).
function BulletList({ items }: { items: Extract<Block, { type: "bullet" }>[] }) {
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
