// Декоративный фон лендинга в стилистике профессии финаналитика:
// изумрудные свечения + сетка + свечной график + растущий график + ghost-цифры.
// Чисто визуальный слой, не мешает контенту (fixed, -z-10, без событий).

const CANDLES = [
  { x: 10, o: 70, c: 40, hi: 30, lo: 85, up: true },
  { x: 34, o: 55, c: 62, hi: 40, lo: 78, up: false },
  { x: 58, o: 62, c: 30, hi: 22, lo: 70, up: true },
  { x: 82, o: 45, c: 52, hi: 32, lo: 66, up: false },
  { x: 106, o: 50, c: 24, hi: 16, lo: 58, up: true },
  { x: 130, o: 30, c: 40, hi: 22, lo: 52, up: false },
  { x: 154, o: 38, c: 18, hi: 10, lo: 46, up: true },
  { x: 178, o: 24, c: 30, hi: 14, lo: 40, up: false },
];

const TICKERS: { text: string; className: string }[] = [
  { text: "EBITDA", className: "left-[6%] top-[20%] text-2xl" },
  { text: "NPV > 0", className: "right-[7%] top-[34%] text-xl" },
  { text: "IRR 18,4%", className: "left-[11%] top-[58%] text-lg" },
  { text: "WACC 14,2%", className: "right-[12%] bottom-[24%] text-xl" },
  { text: "+12,4%", className: "left-[44%] top-[46%] text-3xl" },
  { text: "DCF", className: "left-[30%] bottom-[30%] text-2xl" },
  { text: "P/E 9,8", className: "right-[28%] top-[14%] text-lg" },
];

export function SiteBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Свечения */}
      <div
        className="absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,193,123,0.16), transparent 60%)" }}
      />
      <div
        className="absolute left-[-18%] top-1/4 h-[38rem] w-[38rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,193,123,0.07), transparent 60%)" }}
      />
      <div
        className="absolute bottom-[-12%] left-1/3 h-[40rem] w-[40rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(70,110,255,0.06), transparent 60%)" }}
      />

      {/* Сетка с затуханием */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.032) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          WebkitMaskImage: "radial-gradient(125% 85% at 50% 0%, #000 38%, transparent 85%)",
          maskImage: "radial-gradient(125% 85% at 50% 0%, #000 38%, transparent 85%)",
        }}
      />

      {/* Ghost-цифры и термины */}
      {TICKERS.map((t) => (
        <span
          key={t.text}
          className={`absolute select-none font-mono font-bold tracking-tight text-[rgba(52,193,123,0.08)] ${t.className}`}
        >
          {t.text}
        </span>
      ))}

      {/* Свечной график (правый верх) */}
      <svg
        className="absolute right-[3%] top-[9%] w-[min(34rem,42vw)] opacity-90"
        viewBox="0 0 200 100"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {CANDLES.map((k) => {
          const color = k.up ? "rgba(52,193,123,0.5)" : "rgba(239,122,99,0.4)";
          const top = Math.min(k.o, k.c);
          const h = Math.max(2, Math.abs(k.o - k.c));
          return (
            <g key={k.x} stroke={color} fill={color}>
              <line x1={k.x + 6} y1={k.hi} x2={k.x + 6} y2={k.lo} strokeWidth="1" />
              <rect x={k.x} y={top} width="12" height={h} rx="1" fillOpacity="0.35" />
            </g>
          );
        })}
      </svg>

      {/* Растущий график (низ) */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "34vh" }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="fin-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34c17b" stopOpacity="0.13" />
            <stop offset="1" stopColor="#34c17b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,320 L120,300 L240,330 L360,260 L480,282 L600,208 L720,238 L840,168 L960,198 L1080,120 L1200,150 L1320,78 L1440,108 L1440,400 L0,400 Z"
          fill="url(#fin-area)"
        />
        <path
          d="M0,320 L120,300 L240,330 L360,260 L480,282 L600,208 L720,238 L840,168 L960,198 L1080,120 L1200,150 L1320,78 L1440,108"
          stroke="#34c17b"
          strokeOpacity="0.22"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
