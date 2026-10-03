const compact = new Intl.NumberFormat("en-US", { notation: "compact", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
const UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

const isBlank = (x) => x === undefined || x === null || Number.isNaN(Number(x));

// Sub-cent coins need more decimals, or SHIB-style prices collapse to "0.00".
export function formatPrice(value, symbol = "") {
  if (isBlank(value)) return "—";
  const n = Number(value);
  const abs = Math.abs(n);
  const digits = abs >= 1 || abs === 0 ? 2 : abs >= 0.01 ? 4 : abs >= 0.0001 ? 6 : 8;
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
}

export function formatMarketCap(value, symbol = "") {
  if (!value || isBlank(value)) return "—";
  return `${symbol}${compact.format(value)}`;
}

export function formatPercent(value) {
  if (isBlank(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(2)}%`;
}

export function timeAgo(value, now = Date.now()) {
  const time = typeof value === "number" ? value : new Date(value).getTime();
  if (!value || Number.isNaN(time)) return "";
  const diff = (time - now) / 1000;
  const [unit, seconds] = UNITS.find(([, size]) => Math.abs(diff) >= size) || UNITS[UNITS.length - 1];
  return relative.format(Math.round(diff / seconds), unit);
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", options);
}

export function stripHtml(html) {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

// Links from feeds and profiles are third-party data: only http(s) URLs may become hrefs.
export function safeUrl(link) {
  try {
    const url = new URL(link);
    return /^https?:$/.test(url.protocol) ? url : null;
  } catch {
    return null;
  }
}
