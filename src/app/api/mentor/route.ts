import https from "node:https";
import { z } from "zod";
import { SocksProxyAgent } from "socks-proxy-agent";
import { buildMentorSystemPrompt, type LessonContext } from "@/lib/mentor-prompt";
import { getLessonByNum } from "@/content/course";
import { getVerifiedUser } from "@/lib/auth";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
  lessonNum: z.string().optional(),
});

type ProxyResponse = { status: number; json: Record<string, unknown> };

function proxiedPostJson(
  url: string,
  body: unknown,
  proxyUrl: string | undefined
): Promise<ProxyResponse> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        agent,
        timeout: 30000,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, json: JSON.parse(buf || "{}") });
          } catch {
            resolve({ status: res.statusCode ?? 0, json: {} });
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Gemini timeout"));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export async function POST(req: Request) {
  // Наставник — только для авторизованных И одобренных: иначе любой
  // зарегистрировавшийся мог бы расходовать платный ключ Gemini без доступа к курсу.
  const currentUser = await getVerifiedUser();
  if (!currentUser) {
    return Response.json({ error: "Войдите, чтобы задавать вопросы наставнику." }, { status: 401 });
  }
  if (!currentUser.approved) {
    return Response.json({ error: "Наставник доступен после открытия доступа к курсу." }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Наставник пока не настроен: добавьте GEMINI_API_KEY в .env.local." },
      { status: 200 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Ошибка данных" }, { status: 400 });

  const { messages, lessonNum } = parsed.data;

  // Контекст урока
  let lc: LessonContext = null;
  if (lessonNum) {
    const fl = getLessonByNum(lessonNum);
    if (fl) {
      lc = {
        lessonNum: fl.lesson.num,
        lessonTitle: fl.lesson.title,
        moduleNum: fl.module.n,
        moduleSubtitle: fl.module.subtitle,
      };
    }
  }
  const system = buildMentorSystemPrompt(lc);
  const model = process.env.MENTOR_MODEL || "gemini-flash-latest";
  const proxyUrl = process.env.MENTOR_PROXY_URL || undefined;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const { status, json } = await proxiedPostJson(
      url,
      {
        system_instruction: { parts: [{ text: system }] },
        contents,
        // 3.x-flash — модель с «размышлением»: даём запас токенов, чтобы ответ не был пустым
        generationConfig: { maxOutputTokens: 2048 },
      },
      proxyUrl
    );

    if (status < 200 || status >= 300) {
      const errObj = json.error as { message?: string } | undefined;
      return Response.json(
        { error: errObj?.message || `Ошибка Gemini (${status})` },
        { status: 200 }
      );
    }

    const candidates = (json.candidates as
      | { content?: { parts?: { text?: string }[] } }[]
      | undefined) ?? [];
    const text = (candidates[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (!text) {
      return Response.json(
        { error: "Наставник не смог сформировать ответ. Попробуйте переформулировать." },
        { status: 200 }
      );
    }
    return Response.json({ text });
  } catch (e) {
    return Response.json(
      { error: `Не удалось связаться с наставником: ${(e as Error).message}` },
      { status: 200 }
    );
  }
}
