export function numberWithCommas(x) {
  if (x === undefined || x === null || Number.isNaN(Number(x))) return "—";
  return Number(x)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatMarketCap(value, symbol = "") {
  if (!value) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  return `${symbol}${numberWithCommas(value)}`;
}

export function formatPercent(value) {
  if (value === undefined || value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(2)}%`;
}

export function stripHtml(html) {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}
