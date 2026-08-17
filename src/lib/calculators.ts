// Финансовые калькуляторы. Формулы перенесены 1-в-1 из прототипа
// docs/source/course-app_2.html (CALC_RENDERERS). Чистые функции, без DOM.

/** NPV: -I0 + Σ CF_t / (1+r)^t, t = 1..n */
export function calcNPV(i0: number, rate: number, cfs: number[]): number {
  let npv = -i0;
  cfs.forEach((cf, idx) => {
    npv += cf / Math.pow(1 + rate, idx + 1);
  });
  return npv;
}

/** IRR методом бисекции на [-0.99, 10]; null если знак не меняется. */
export function calcIRR(i0: number, cfs: number[]): number | null {
  const f = (r: number) => calcNPV(i0, r, cfs);
  let lo = -0.99,
    hi = 10;
  let flo = f(lo);
  const fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo < 0 === fhi < 0) return null;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6) return mid;
    if (flo < 0 === fmid < 0) {
      lo = mid;
      flo = fmid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/** WACC = (E/V)·Re + (D/V)·Rd·(1−Tax). Ставки в долях (0.22 = 22%). */
export function calcWACC(
  E: number,
  D: number,
  Re: number,
  Rd: number,
  Tax: number
): { eOverV: number; dOverV: number; wacc: number } {
  const V = E + D;
  const eOverV = V ? E / V : 0;
  const dOverV = V ? D / V : 0;
  const wacc = eOverV * Re + dOverV * Rd * (1 - Tax);
  return { eOverV, dOverV, wacc };
}

/** CAPM: Re = Rf + β·ERP. Ставки в долях. */
export function calcCAPM(rf: number, beta: number, erp: number): number {
  return rf + beta * erp;
}

/** Точка безубыточности и операционный рычаг (DOL). */
export function calcBreakeven(
  fixed: number,
  price: number,
  varCost: number,
  volume: number
): { cm: number; beVolume: number | null; dol: number | null } {
  const cm = price - varCost;
  const beVolume = cm > 0 ? Math.ceil(fixed / cm) : null;
  const operProfit = volume * cm - fixed;
  const dol =
    operProfit !== 0 && cm > 0 ? (volume * cm) / operProfit : null;
  return { cm, beVolume, dol: dol !== null && isFinite(dol) && dol > 0 ? dol : null };
}

/** LTV = ARPU·маржа / отток;  ratio = LTV / CAC.  Маржа и отток в долях. */
export function calcLTV(
  arpu: number,
  margin: number,
  churn: number,
  cac: number
): { ltv: number | null; ratio: number | null } {
  const ltv = churn > 0 ? (arpu * margin) / churn : null;
  const ratio = cac > 0 && ltv !== null ? ltv / cac : null;
  return { ltv, ratio };
}

/** Цена облигации: Σ купон/(1+ytm)^t + номинал/(1+ytm)^n. Ставки в долях. */
export function calcBondPrice(
  face: number,
  couponRate: number,
  ytm: number,
  years: number
): number {
  const coupon = face * couponRate;
  let price = 0;
  for (let t = 1; t <= years; t++) price += coupon / Math.pow(1 + ytm, t);
  price += face / Math.pow(1 + ytm, years);
  return price;
}

/** Уравнение Фишера: реальная ставка (точно и приближённо). Ставки в долях. */
export function calcFisher(
  nominal: number,
  inflation: number
): { real: number; approx: number } {
  return {
    real: (1 + nominal) / (1 + inflation) - 1,
    approx: nominal - inflation,
  };
}

/** Форматирование числа с разделением разрядов (пробел), как fmtNum в прототипе. */
export function fmtNum(value: number, digits = 0): string {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
