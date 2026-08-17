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
  { key: "npv", label: "NPV / IRR" },
  { key: "wacc", label: "WACC" },
  { key: "capm", label: "CAPM" },
  { key: "breakeven", label: "Точка безубыточности" },
  { key: "ltv", label: "LTV / CAC" },
  { key: "bond", label: "Облигация и Фишер" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CalculatorsClient() {
  const [tab, setTab] = useState<TabKey>("npv");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-green bg-green text-on-green"
                : "border-border bg-card text-ink-secondary hover:border-green/50 hover:text-green-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
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

/* --------------------- переиспользуемые части --------------------- */
function num(v: string): number {
  return parseFloat(v) || 0;
}

function CalcBox({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="card p-6 sm:p-7">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-secondary">{desc}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-ink-secondary">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-green focus:outline-none sm:w-48"
      />
    </label>
  );
}

function Results({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Result({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? "border-amber/40 bg-amber-light" : "border-border bg-surface"}`}>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${warn ? "text-amber" : "text-green-dark"}`}>
        {value}
      </div>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-xs leading-relaxed text-ink-muted">{children}</p>;
}

/* ----------------------------- NPV/IRR ----------------------------- */
function NpvCalc() {
  const [i0, setI0] = useState("1000000");
  const [rate, setRate] = useState("16");
  const [cfs, setCfs] = useState(["400000", "400000", "400000", "0", "0", "0"]);
  const cfNums = cfs.map(num);
  const npv = calcNPV(num(i0), num(rate) / 100, cfNums);
  const irr = calcIRR(num(i0), cfNums);

  return (
    <CalcBox title="NPV / IRR" desc="Первоначальные инвестиции и денежные потоки по годам. IRR считается численно (методом бисекции).">
      <Row label="Первоначальные инвестиции, ₽" value={i0} onChange={setI0} />
      <Row label="Ставка дисконтирования (WACC), %" value={rate} onChange={setRate} />
      {cfs.map((cf, i) => (
        <Row
          key={i}
          label={`Год ${i + 1}, ₽`}
          value={cf}
          onChange={(v) => setCfs(cfs.map((x, j) => (j === i ? v : x)))}
        />
      ))}
      <Results>
        <Result label="NPV" value={fmtNum(npv, 0) + " ₽"} />
        <Result label="IRR" value={irr === null ? "не определён" : (irr * 100).toFixed(1) + "%"} />
      </Results>
      <Note>
        NPV &gt; 0 и IRR выше ставки дисконтирования — проект создаёт стоимость. При потоках,
        несколько раз меняющих знак, IRR может быть не определён однозначно.
      </Note>
    </CalcBox>
  );
}

/* ------------------------------- WACC ------------------------------- */
function WaccCalc() {
  const [E, setE] = useState("600000000");
  const [D, setD] = useState("400000000");
  const [Re, setRe] = useState("22");
  const [Rd, setRd] = useState("15");
  const [Tax, setTax] = useState("25");
  const r = calcWACC(num(E), num(D), num(Re) / 100, num(Rd) / 100, num(Tax) / 100);

  return (
    <CalcBox title="WACC" desc="Средневзвешенная стоимость капитала: (E/V)×Re + (D/V)×Rd×(1−Налог).">
      <Row label="Собственный капитал E, ₽" value={E} onChange={setE} />
      <Row label="Заёмный капитал D, ₽" value={D} onChange={setD} />
      <Row label="Стоимость собственного капитала Re, %" value={Re} onChange={setRe} />
      <Row label="Стоимость долга до налога Rd, %" value={Rd} onChange={setRd} />
      <Row label="Налог на прибыль, %" value={Tax} onChange={setTax} />
      <Results>
        <Result label="E/V" value={(r.eOverV * 100).toFixed(1) + "%"} />
        <Result label="D/V" value={(r.dOverV * 100).toFixed(1) + "%"} />
        <Result label="WACC" value={(r.wacc * 100).toFixed(2) + "%"} />
      </Results>
    </CalcBox>
  );
}

/* ------------------------------- CAPM ------------------------------- */
function CapmCalc() {
  const [rf, setRf] = useState("12");
  const [beta, setBeta] = useState("1.3");
  const [erp, setErp] = useState("6");
  const re = calcCAPM(num(rf) / 100, num(beta), num(erp) / 100);

  return (
    <CalcBox title="CAPM" desc="Стоимость собственного капитала: Re = Rf + β × ERP.">
      <Row label="Безрисковая ставка Rf, %" value={rf} onChange={setRf} />
      <Row label="Бета (β)" value={beta} onChange={setBeta} step="0.01" />
      <Row label="Премия за риск акций (ERP), %" value={erp} onChange={setErp} />
      <Results>
        <Result label="Re (CAPM)" value={(re * 100).toFixed(2) + "%"} />
      </Results>
    </CalcBox>
  );
}

/* --------------------------- Breakeven ----------------------------- */
function BreakevenCalc() {
  const [fixed, setFixed] = useState("800000");
  const [price, setPrice] = useState("6400");
  const [varCost, setVarCost] = useState("3200");
  const [volume, setVolume] = useState("400");
  const r = calcBreakeven(num(fixed), num(price), num(varCost), num(volume));

  return (
    <CalcBox title="Точка безубыточности и операционный рычаг" desc="Сколько единиц нужно продать, чтобы покрыть постоянные затраты, и как прибыль реагирует на объём (DOL).">
      <Row label="Постоянные затраты, ₽/мес" value={fixed} onChange={setFixed} />
      <Row label="Цена за единицу, ₽" value={price} onChange={setPrice} />
      <Row label="Переменные затраты на единицу, ₽" value={varCost} onChange={setVarCost} />
      <Row label="Текущий объём продаж, ед./мес" value={volume} onChange={setVolume} />
      <Results>
        <Result label="Маржа на единицу" value={fmtNum(r.cm, 0) + " ₽"} />
        <Result label="Точка безубыточности" value={r.beVolume !== null ? r.beVolume + " ед." : "—"} />
        <Result label="Операционный рычаг (DOL)" value={r.dol !== null ? r.dol.toFixed(2) + "×" : "—"} />
      </Results>
    </CalcBox>
  );
}

/* ------------------------------ LTV/CAC ---------------------------- */
function LtvCalc() {
  const [arpu, setArpu] = useState("600");
  const [margin, setMargin] = useState("60");
  const [churn, setChurn] = useState("10");
  const [cac, setCac] = useState("1500");
  const r = calcLTV(num(arpu), num(margin) / 100, num(churn) / 100, num(cac));
  const warn = r.ratio !== null && r.ratio < 3;

  return (
    <CalcBox title="LTV / CAC" desc="LTV = ARPU × Валовая маржа / Отток. Здоровое соотношение LTV/CAC — от 3× и выше.">
      <Row label="Средний чек (ARPU), ₽/мес" value={arpu} onChange={setArpu} />
      <Row label="Валовая маржа, %" value={margin} onChange={setMargin} />
      <Row label="Отток (churn), %/мес" value={churn} onChange={setChurn} />
      <Row label="CAC, ₽" value={cac} onChange={setCac} />
      <Results>
        <Result label="LTV" value={r.ltv !== null ? fmtNum(r.ltv, 0) + " ₽" : "—"} />
        <Result label="LTV / CAC" value={r.ratio !== null ? r.ratio.toFixed(2) + "×" : "—"} warn={warn} />
      </Results>
      <Note>Ориентир из курса: соотношение LTV/CAC ниже 3× подсвечивается как рискованное.</Note>
    </CalcBox>
  );
}

/* --------------------------- Bond + Fisher ------------------------- */
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
      <CalcBox title="Цена облигации" desc="Приведённая стоимость купонов и номинала при заданной требуемой доходности (YTM).">
        <Row label="Номинал, ₽" value={face} onChange={setFace} />
        <Row label="Купонная ставка, % годовых" value={coupon} onChange={setCoupon} />
        <Row label="Требуемая доходность (YTM), %" value={ytm} onChange={setYtm} />
        <Row label="Срок до погашения, лет" value={years} onChange={setYears} />
        <Results>
          <Result label="Цена облигации" value={fmtNum(price, 2) + " ₽"} />
        </Results>
      </CalcBox>

      <CalcBox title="Уравнение Фишера" desc="Точная связь номинальной и реальной ставки: (1+ном.) = (1+реальная) × (1+инфляция).">
        <Row label="Номинальная ставка, %" value={nom} onChange={setNom} />
        <Row label="Ожидаемая инфляция, %" value={infl} onChange={setInfl} />
        <Results>
          <Result label="Реальная ставка (точно)" value={(fisher.real * 100).toFixed(2) + "%"} />
          <Result label="Приближённо (ном. − инфл.)" value={(fisher.approx * 100).toFixed(2) + "%"} />
        </Results>
      </CalcBox>
    </div>
  );
}
