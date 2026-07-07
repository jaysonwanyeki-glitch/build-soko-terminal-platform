// Synthesises plausible annual financial statements for an NSE company from
// its live fundamentals (market cap, P/E, EPS, dividend yield, sector).

export type StatementRow = { label: string; values: number[] };

export type FinancialStatements = {
  income: StatementRow[];
  balance: StatementRow[];
  cashflow: StatementRow[];
  ratios: { label: string; value: string }[];
};

export function buildFinancials(opts: {
  symbol: string;
  marketCap: number;
  eps: number;
  peRatio: number;
  dividendYield: number;
  price: number;
  sharesOutstanding: number;
}): FinancialStatements {
  const { symbol: sym, eps, peRatio, dividendYield, price, sharesOutstanding } = opts;
  const rnd = (() => {
    let h = 2166136261;
    for (let i = 0; i < sym.length; i++) {
      h ^= sym.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();

  const yr = (base: number, growth: number, vol = 0.06): [number, number, number] => {
    const g3 = 1 + growth + (rnd() - 0.5) * vol;
    const g2 = 1 + growth + (rnd() - 0.5) * vol;
    const g1 = 1 + growth + (rnd() - 0.5) * vol;
    return [base / g3 / g2, base / g2, base];
  };

  const netIncome = (eps || 0) * (sharesOutstanding || 1);
  const revenue = netIncome / (0.08 + rnd() * 0.16); // 8–24% net margin
  const rev = yr(revenue, 0.08);
  const cogs = rev.map((v) => v * (0.45 + rnd() * 0.2));
  const grossProfit = rev.map((v, i) => v - cogs[i]);
  const opex = rev.map((v) => v * (0.2 + rnd() * 0.1));
  const opProfit = grossProfit.map((v, i) => v - opex[i]);
  const ni = yr(netIncome, 0.1);
  const ebitda = opProfit.map((v) => v * (1.15 + rnd() * 0.15));

  const m = (arr: number[]) => arr.map((v) => v / 1e6);

  const income: StatementRow[] = [
    { label: "Revenue", values: m(rev) },
    { label: "Cost of Sales", values: m(cogs) },
    { label: "Gross Profit", values: m(grossProfit) },
    { label: "Operating Expenses", values: m(opex) },
    { label: "Operating Income", values: m(opProfit) },
    { label: "EBITDA", values: m(ebitda) },
    { label: "Net Income", values: m(ni) },
  ];

  // balance sheet
  const totalAssets = netIncome / (0.02 + rnd() * 0.04);
  const ta = yr(totalAssets, 0.06);
  const cash = ta.map((v) => v * (0.08 + rnd() * 0.12));
  const receivables = ta.map((v) => v * (0.06 + rnd() * 0.08));
  const inventory = ta.map((v) => v * (0.04 + rnd() * 0.1));
  const ppe = ta.map((v) => v * (0.3 + rnd() * 0.2));
  const totalLiab = ta.map((v) => v * (0.55 + rnd() * 0.15));
  const debt = ta.map((v) => v * (0.15 + rnd() * 0.15));
  const equity = ta.map((v, i) => v - totalLiab[i]);

  const balance: StatementRow[] = [
    { label: "Cash & Equivalents", values: m(cash) },
    { label: "Receivables", values: m(receivables) },
    { label: "Inventory", values: m(inventory) },
    { label: "Property, Plant & Equipment", values: m(ppe) },
    { label: "Total Assets", values: m(ta) },
    { label: "Total Debt", values: m(debt) },
    { label: "Total Liabilities", values: m(totalLiab) },
    { label: "Shareholders' Equity", values: m(equity) },
  ];

  // cash flow
  const cfo = ni.map((v) => v * (1.1 + rnd() * 0.3));
  const capex = cfo.map((v) => -v * (0.2 + rnd() * 0.2));
  const fcf = cfo.map((v, i) => v + capex[i]);
  const dividends = ni.map((v) => -v * ((dividendYield || 0) / 100 + 0.3));

  const cashflow: StatementRow[] = [
    { label: "Cash from Operations", values: m(cfo) },
    { label: "Capital Expenditure", values: m(capex) },
    { label: "Free Cash Flow", values: m(fcf) },
    { label: "Dividends Paid", values: m(dividends) },
  ];

  const roe = (netIncome / equity[equity.length - 1]) * 100;
  const roa = (netIncome / ta[ta.length - 1]) * 100;
  const netMargin = (netIncome / revenue) * 100;
  const debtToEquity = totalLiab[totalLiab.length - 1] / equity[equity.length - 1];

  const ratios = [
    { label: "EPS (KSh)", value: (eps || 0).toFixed(2) },
    { label: "P/E Ratio", value: (peRatio || 0).toFixed(1) },
    { label: "Net Margin", value: netMargin.toFixed(1) + "%" },
    { label: "ROE", value: roe.toFixed(1) + "%" },
    { label: "ROA", value: roa.toFixed(1) + "%" },
    { label: "Debt / Equity", value: debtToEquity.toFixed(2) },
    { label: "Dividend Yield", value: (dividendYield || 0).toFixed(2) + "%" },
    { label: "Book Value / Share", value: (equity[equity.length - 1] / (sharesOutstanding || 1)).toFixed(2) },
  ];

  return { income, balance, cashflow, ratios };
}
