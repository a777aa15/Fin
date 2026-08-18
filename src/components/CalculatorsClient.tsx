"use client";

import { useState, type ReactNode } from "react";
import {
  calcNPV,
  calcIRR,
  calcWACC,
  calcCAPM,
  calcBreakeven,
  calcLTV,
  calcBondPrice,
  calcFisher,
  fmtNum,
} from "@/lib/calculators";

const TABS = [
  { key: "npv", label: "NPV / IRR", icon: "growth" },
  { key: "wacc", label: "WACC", icon: "scale" },
  { key: "capm", label: "CAPM", icon: "percent" },
  { key: "breakeven", label: "Безубыточность", icon: "target" },
  { key: "ltv", label: "LTV / CAC", icon: "users" },
  { key: "bond", label: "Облигация · Фишер", icon: "doc" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CalculatorsClient() {
  const [tab, setTab] = useState<TabKey>("npv");
  return (
    <div>
      {/* Вкладки */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "border-green bg-green text-on-green shadow-[0_8px_24px_-10px_rgba(52,193,123,0.7)]"
                  : "border-border bg-card/60 text-ink-secondary hover:border-green/50 hover:text-ink"
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "npv" && <NpvCalc />}
        {tab === "wacc" && <WaccCalc />}
        {tab === "capm" && <CapmCalc />}
        {tab === "breakeven" && <BreakevenCalc />}
        {tab === "ltv" && <LtvCalc />}
        {tab === "bond" && <BondCalc />}
      </div>
    </div>
  );
}

/* ============================ примитивы ============================ */
function num(v: string): number {
  return parseFloat(v) || 0;
}

function Icon({ name, className }: { name: string; className?: string }) {
  const c = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, className, "aria-hidden": true } as const;
  switch (name) {
    case "growth":
      return <svg {...c}><path d="M4 20V4M4 20h16" strokeLinecap="round" /><path d="M7 15l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "scale":
      return <svg {...c}><path d="M12 3v18M6 7h12M6 7l-3 6a3 3 0 006 0L6 7zm12 0l-3 6a3 3 0 006 0l-3-6z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "percent":
      return <svg {...c}><path d="M19 5L5 19" strokeLinecap="round" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>;
    case "target":
      return <svg {...c}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>;
    case "users":
      return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 6.5a3 3 0 010 5.8M20.5 19a5.5 5.5 0 00-4-5.3" strokeLinecap="round" /></svg>;
    case "doc":
      return <svg {...c}><path d="M7 3h7l4 4v14H7z" strokeLinejoin="round" /><path d="M14 3v4h4M9.5 12h5M9.5 16h5" strokeLinecap="round" /></svg>;
    default:
      return null;
  }
}

function CalcShell({
  title,
  formula,
  icon,
  inputs,
  results,
  note,
}: {
  title: string;
  formula: string;
  icon: string;
  inputs: ReactNode;
  results: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur-sm">
      {/* Шапка */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green text-on-green">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <code className="mt-1 inline-block max-w-full truncate rounded-md bg-grey-light px-2 py-0.5 font-mono text-xs text-green-dark">
            {formula}
          </code>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        {/* Поля */}
        <div className="p-6">{inputs}</div>
        {/* Результат */}
        <div
          className="border-t border-border p-6 lg:border-l lg:border-t-0"
          style={{ background: "rgba(52,193,123,0.05)" }}
        >
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">Результат</div>
          <div className="space-y-5">{results}</div>
          {note ? <div className="mt-5 border-t border-border pt-4">{note}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Fields({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  unit,
  step,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  step?: string;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-secondary">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-11 text-sm tabular-nums text-ink transition-colors focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
        />
        {unit ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted">
            {unit}
          </span>
        ) : null}
      </div>
    </label>
  );
}

// Основной (крупный) результат.
function Big({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl ${warn ? "text-amber" : "text-green-dark"}`}>
        {value}
      </div>
    </div>
  );
}

// Второстепенный результат.
function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className={`text-lg font-bold tabular-nums ${warn ? "text-amber" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-ink-muted">{children}</p>;
}

/* ============================= NPV/IRR ============================= */
function NpvCalc() {
  const [i0, setI0] = useState("1000000");
  const [rate, setRate] = useState("16");
  const [cfs, setCfs] = useState(["400000", "400000", "400000", "0", "0", "0"]);
  const cfNums = cfs.map(num);
  const npv = calcNPV(num(i0), num(rate) / 100, cfNums);
  const irr = calcIRR(num(i0), cfNums);

  return (
    <CalcShell
      title="NPV / IRR"
      formula="NPV = Σ CFₜ/(1+r)ᵗ − CF₀"
      icon="growth"
      inputs={
        <div className="space-y-5">
          <Fields>
            <Field label="Первоначальные инвестиции" value={i0} onChange={setI0} unit="₽" />
            <Field label="Ставка дисконтирования (WACC)" value={rate} onChange={setRate} unit="%" />
          </Fields>
          <div>
            <div className="mb-2 text-xs font-medium text-ink-secondary">Денежные потоки по годам, ₽</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cfs.map((cf, i) => (
                <label key={i} className="block">
                  <span className="mb-1 block text-[11px] text-ink-muted">Год {i + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cf}
                    onChange={(e) => setCfs(cfs.map((x, j) => (j === i ? e.target.value : x)))}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm tabular-nums text-ink focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      }
      results={
        <>
          <Big label="Чистая приведённая стоимость (NPV)" value={fmtNum(npv, 0) + " ₽"} warn={npv < 0} />
          <Stat label="Внутр. норма доходности (IRR)" value={irr === null ? "—" : (irr * 100).toFixed(1) + "%"} />
        </>
      }
      note={
        <Note>
          NPV &gt; 0 и IRR выше ставки дисконтирования — проект создаёт стоимость. При потоках,
          несколько раз меняющих знак, IRR может быть не определён однозначно.
        </Note>
      }
    />
  );
}

/* ============================== WACC ============================== */
function WaccCalc() {
  const [E, setE] = useState("600000000");
  const [D, setD] = useState("400000000");
  const [Re, setRe] = useState("22");
  const [Rd, setRd] = useState("15");
  const [Tax, setTax] = useState("25");
  const r = calcWACC(num(E), num(D), num(Re) / 100, num(Rd) / 100, num(Tax) / 100);

  return (
    <CalcShell
      title="WACC"
      formula="WACC = E/V·Re + D/V·Rd·(1−T)"
      icon="scale"
      inputs={
        <Fields>
          <Field label="Собственный капитал E" value={E} onChange={setE} unit="₽" />
          <Field label="Заёмный капитал D" value={D} onChange={setD} unit="₽" />
          <Field label="Стоимость капитала Re" value={Re} onChange={setRe} unit="%" />
          <Field label="Стоимость долга Rd" value={Rd} onChange={setRd} unit="%" />
          <Field label="Налог на прибыль" value={Tax} onChange={setTax} unit="%" full />
        </Fields>
      }
      results={
        <>
          <Big label="Средневзвешенная стоимость капитала" value={(r.wacc * 100).toFixed(2) + "%"} />
          <Stat label="Доля собственного капитала E/V" value={(r.eOverV * 100).toFixed(1) + "%"} />
          <Stat label="Доля долга D/V" value={(r.dOverV * 100).toFixed(1) + "%"} />
        </>
      }
    />
  );
}

/* ============================== CAPM ============================== */
function CapmCalc() {
  const [rf, setRf] = useState("12");
  const [beta, setBeta] = useState("1.3");
  const [erp, setErp] = useState("6");
  const re = calcCAPM(num(rf) / 100, num(beta), num(erp) / 100);

  return (
    <CalcShell
      title="CAPM"
      formula="Re = Rf + β·ERP"
      icon="percent"
      inputs={
        <Fields>
          <Field label="Безрисковая ставка Rf" value={rf} onChange={setRf} unit="%" />
          <Field label="Бета (β)" value={beta} onChange={setBeta} step="0.01" />
          <Field label="Премия за риск акций (ERP)" value={erp} onChange={setErp} unit="%" full />
        </Fields>
      }
      results={<Big label="Стоимость собственного капитала Re" value={(re * 100).toFixed(2) + "%"} />}
    />
  );
}

/* =========================== Breakeven ============================ */
function BreakevenCalc() {
  const [fixed, setFixed] = useState("800000");
  const [price, setPrice] = useState("6400");
  const [varCost, setVarCost] = useState("3200");
  const [volume, setVolume] = useState("400");
  const r = calcBreakeven(num(fixed), num(price), num(varCost), num(volume));

  return (
    <CalcShell
      title="Точка безубыточности · рычаг"
      formula="Q* = FC / (P − VC)"
      icon="target"
      inputs={
        <Fields>
          <Field label="Постоянные затраты, ₽/мес" value={fixed} onChange={setFixed} unit="₽" />
          <Field label="Цена за единицу" value={price} onChange={setPrice} unit="₽" />
          <Field label="Переменные затраты на ед." value={varCost} onChange={setVarCost} unit="₽" />
          <Field label="Текущий объём, ед./мес" value={volume} onChange={setVolume} unit="ед." />
        </Fields>
      }
      results={
        <>
          <Big label="Точка безубыточности" value={r.beVolume !== null ? r.beVolume + " ед." : "—"} />
          <Stat label="Маржа на единицу" value={fmtNum(r.cm, 0) + " ₽"} />
          <Stat label="Операционный рычаг (DOL)" value={r.dol !== null ? r.dol.toFixed(2) + "×" : "—"} />
        </>
      }
    />
  );
}

/* ============================= LTV/CAC ============================ */
function LtvCalc() {
  const [arpu, setArpu] = useState("600");
  const [margin, setMargin] = useState("60");
  const [churn, setChurn] = useState("10");
  const [cac, setCac] = useState("1500");
  const r = calcLTV(num(arpu), num(margin) / 100, num(churn) / 100, num(cac));
  const warn = r.ratio !== null && r.ratio < 3;

  return (
    <CalcShell
      title="LTV / CAC"
      formula="LTV = ARPU·GM / churn"
      icon="users"
      inputs={
        <Fields>
          <Field label="Средний чек (ARPU), ₽/мес" value={arpu} onChange={setArpu} unit="₽" />
          <Field label="Валовая маржа" value={margin} onChange={setMargin} unit="%" />
          <Field label="Отток (churn), %/мес" value={churn} onChange={setChurn} unit="%" />
          <Field label="Стоимость привлечения CAC" value={cac} onChange={setCac} unit="₽" />
        </Fields>
      }
      results={
        <>
          <Big label="Отношение LTV / CAC" value={r.ratio !== null ? r.ratio.toFixed(2) + "×" : "—"} warn={warn} />
          <Stat label="Пожизненная ценность (LTV)" value={r.ltv !== null ? fmtNum(r.ltv, 0) + " ₽" : "—"} />
        </>
      }
      note={<Note>Здоровое соотношение LTV/CAC — от 3× и выше. Ниже 3× подсвечивается как рискованное.</Note>}
    />
  );
}

/* ========================== Bond + Fisher ========================= */
function BondCalc() {
  const [face, setFace] = useState("1000");
  const [coupon, setCoupon] = useState("9");
  const [ytm, setYtm] = useState("12");
  const [years, setYears] = useState("5");
  const price = calcBondPrice(num(face), num(coupon) / 100, num(ytm) / 100, parseInt(years) || 0);

  const [nom, setNom] = useState("15");
  const [infl, setInfl] = useState("8");
  const fisher = calcFisher(num(nom) / 100, num(infl) / 100);

  return (
    <div className="space-y-5">
      <CalcShell
        title="Цена облигации"
        formula="P = Σ C/(1+y)ᵗ + N/(1+y)ⁿ"
        icon="doc"
        inputs={
          <Fields>
            <Field label="Номинал" value={face} onChange={setFace} unit="₽" />
            <Field label="Купонная ставка, % год." value={coupon} onChange={setCoupon} unit="%" />
            <Field label="Доходность (YTM)" value={ytm} onChange={setYtm} unit="%" />
            <Field label="Срок до погашения" value={years} onChange={setYears} unit="лет" />
          </Fields>
        }
        results={<Big label="Справедливая цена облигации" value={fmtNum(price, 2) + " ₽"} />}
      />

      <CalcShell
        title="Уравнение Фишера"
        formula="1 + i = (1 + r)(1 + π)"
        icon="percent"
        inputs={
          <Fields>
            <Field label="Номинальная ставка" value={nom} onChange={setNom} unit="%" />
            <Field label="Ожидаемая инфляция" value={infl} onChange={setInfl} unit="%" />
          </Fields>
        }
        results={
          <>
            <Big label="Реальная ставка (точно)" value={(fisher.real * 100).toFixed(2) + "%"} />
            <Stat label="Приближённо (ном. − инфл.)" value={(fisher.approx * 100).toFixed(2) + "%"} />
          </>
        }
      />
    </div>
  );
}
