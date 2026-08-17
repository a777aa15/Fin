// Декоративный фон лендинга в стилистике курса:
// изумрудные свечения + тонкая сетка + мотив растущего графика (рост = финансы).
// Чисто визуальный слой, не мешает контенту.

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

      {/* Мотив растущего графика внизу */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "36vh" }}
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
