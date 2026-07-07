// Maps each NSE ticker to its corporate website domain so we can fetch
// the real company logo via the Clearbit Logo API (with Google favicon fallback).
export const STOCK_DOMAINS: Record<string, string> = {
  SCOM: "safaricom.co.ke",
  EQTY: "equitygroupholdings.com",
  KCB: "kcbgroup.com",
  EABL: "eabl.com",
  SCBK: "sc.com",
  COOP: "co-opbank.co.ke",
  SBIC: "stanbicbank.co.ke",
  ABSB: "absa.co.ke",
  DTKB: "dtbafrica.com",
  NCBA: "ncbaigroup.com",
  HFCK: "hfgroup.co.ke",
  KPLC: "kplc.co.ke",
  KEGN: "kengen.co.ke",
  VIVO: "vivoenergy.com",
  BAMB: "bamburi.com",
  EAPC: "eapcc.co.ke",
  UNGA: "ungagroup.com",
  CARB: "carbacid.co.ke",
  CABL: "eacables.com",
  CTUM: "centum.co.ke",
  JUB: "jubileeplc.com",
  BRIT: "britam.com",
  CIC: "cic.co.ke",
  KRE: "kenyare.co.ke",
  LKL: "libertykenya.com",
  NMG: "nationmedia.com",
  SGL: "standardmedia.co.ke",
  SCAN: "wppscangroup.com",
  SASN: "sasini.co.ke",
  KKZI: "kakuzi.com",
  TPS: "serenahotels.com",
  NSE: "nse.co.ke",
  FLTR: "flametreegroup.com",
  EVER: "evereadafrica.com",
};

export function stockDomain(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  return STOCK_DOMAINS[symbol.toUpperCase()] ?? null;
}
