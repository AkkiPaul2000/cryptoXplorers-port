import { listRiskScore, riskBand } from "./risk";
import { formatPercent } from "./formatters";

// Heuristics over CoinPaprika's change windows. They describe what the data shows right now;
// the UI labels every output as "not financial advice".

const STABLE_SYMBOLS = new Set(["DAI", "FDUSD", "TUSD", "PYUSD", "USDE", "USDS", "USDD", "USD1", "RLUSD", "GHO", "FRAX", "BUIDL", "XAUT", "PAXG"]);
const WRAPPED_SYMBOLS = new Set(["WBTC", "WETH", "CBBTC", "STETH", "WSTETH", "WEETH", "RETH", "CBETH", "METH", "RSETH", "EZETH", "LBTC", "SOLVBTC", "JITOSOL", "MSOL", "BNSOL", "WBNB", "SUSDE", "SUSDS"]);

export const isStable = (coin) =>
  STABLE_SYMBOLS.has(coin.symbol) || /usd/i.test(coin.symbol) || /\b(usd|dollar|euro|gold)\b/i.test(coin.name);
export const isWrapped = (coin) =>
  WRAPPED_SYMBOLS.has(coin.symbol) || /\b(wrapped|staked|restaked|bridged)\b/i.test(coin.name);
export const investable = (coin) => !isStable(coin) && !isWrapped(coin);
// Dollar-pegged stablecoins: judged on peg health, not buy/sell technicals. Yield-bearing
// wrappers (sUSDe, sUSDS) drift above $1 by design, so they aren't held to the peg.
export const isPegged = (coin) =>
  isStable(coin) && !isWrapped(coin) && !/gold|eur|xau|paxg/i.test(`${coin.name} ${coin.symbol}`);

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const get = (coin, key) => Number(coin?.[key]) || 0;
const h1 = (c) => get(c, "price_change_percentage_1h");
const d1 = (c) => get(c, "price_change_percentage_24h");
const w1 = (c) => get(c, "price_change_percentage_7d_in_currency");
const vol = (c) => get(c, "volume_change_24h");

// Feeds occasionally report absurd moves (e.g. +1000% a week after a token migration);
// keep those out of signals and use medians so one glitch can't swing the market read.
const plausible = (c) => Math.abs(w1(c)) <= 300 && Math.abs(d1(c)) <= 150;
const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const SIGNALS = [
  {
    key: "breakout",
    title: "Breakout watch",
    tone: "up",
    blurb: "Accelerating over the last hour and day on rising volume — momentum like this often carries into the next sessions.",
    test: (c) => h1(c) > 0.3 && d1(c) > 2 && vol(c) > 10,
    rank: (c) => d1(c) + vol(c) / 20,
    note: (c) => `${formatPercent(d1(c))} today · volume +${vol(c).toFixed(0)}%`,
  },
  {
    key: "steady",
    title: "Steady climbers",
    tone: "safe",
    blurb: "Up on the hour, day and week with a low risk score — the calmer way to ride a trend.",
    test: (c) => h1(c) > 0 && d1(c) > 0 && w1(c) > 0 && listRiskScore(c) <= 40,
    rank: (c) => w1(c) - listRiskScore(c) / 10,
    note: (c) => `${formatPercent(w1(c))} this week · risk ${listRiskScore(c)}`,
  },
  {
    key: "rebound",
    title: "Rebound candidates",
    tone: "watch",
    blurb: "Sold off over the week but turning up in the last day — early signs of a bounce.",
    test: (c) => w1(c) < -5 && d1(c) > 0.5 && h1(c) >= 0,
    rank: (c) => d1(c) - w1(c),
    note: (c) => `${formatPercent(w1(c))} week · ${formatPercent(d1(c))} today`,
  },
  {
    key: "overheated",
    title: "Overheated",
    tone: "warn",
    blurb: "Sharp run-ups like these often cool off — waiting for a pullback can be the safer entry.",
    test: (c) => w1(c) > 15 || d1(c) > 10,
    rank: (c) => Math.max(w1(c), d1(c) * 1.5),
    note: (c) => `${formatPercent(w1(c))} week · ${formatPercent(d1(c))} today`,
  },
  {
    key: "fading",
    title: "Losing steam",
    tone: "down",
    blurb: "Weekly gains are fading fast today — momentum may be turning.",
    test: (c) => w1(c) > 3 && d1(c) < -2 && h1(c) < 0,
    rank: (c) => w1(c) - d1(c),
    note: (c) => `${formatPercent(w1(c))} week · ${formatPercent(d1(c))} today`,
  },
];

export function signalGroups(coins, limit = 5) {
  const pool = coins.filter((coin) => investable(coin) && plausible(coin));
  return SIGNALS.map(({ test, rank, note, ...signal }) => ({
    ...signal,
    coins: pool
      .filter(test)
      .sort((a, b) => rank(b) - rank(a))
      .slice(0, limit)
      .map((coin) => ({ coin, note: note(coin) })),
  }));
}

export function biasLabel(score) {
  if (score >= 65) return "Bullish";
  if (score >= 55) return "Leaning bullish";
  if (score > 45) return "Neutral";
  if (score > 35) return "Leaning bearish";
  return "Bearish";
}

function weigh(parts) {
  const active = parts.filter((part) => part.weight > 0);
  const total = active.reduce((sum, part) => sum + part.weight, 0) || 1;
  return Math.round(active.reduce((sum, part) => sum + part.score * part.weight, 0) / total);
}

const toneCount = (headlines) =>
  headlines.reduce((acc, item) => ({ ...acc, [item.tone]: (acc[item.tone] || 0) + 1 }), { bullish: 0, bearish: 0 });

export function marketOutlook({ coins, fearGreed, headlines = [] }) {
  const pool = coins.filter(investable);
  const n = pool.length || 1;
  const upShare = pool.filter((c) => d1(c) > 0).length / n;
  const midWeek = median(pool.map(w1));
  const tones = toneCount(headlines);
  const newsBias = headlines.length ? (tones.bullish - tones.bearish) / headlines.length : 0;
  const parts = [
    { label: "Breadth", weight: 0.3, score: upShare * 100, detail: `${Math.round(upShare * 100)}% of coins are up today` },
    { label: "Weekly trend", weight: 0.25, score: clamp(50 + midWeek * 5), detail: `Median 7-day move ${formatPercent(midWeek)}` },
    {
      label: "Sentiment",
      weight: fearGreed == null ? 0 : 0.25,
      score: fearGreed ?? 50,
      detail: fearGreed == null ? "Fear & Greed unavailable" : `Fear & Greed index at ${fearGreed}`,
    },
    {
      label: "Headline tone",
      weight: headlines.length ? 0.2 : 0,
      score: clamp(50 + newsBias * 100),
      detail: `${tones.bullish} bullish vs ${tones.bearish} bearish headlines`,
    },
  ];
  const score = weigh(parts);
  return { score, label: biasLabel(score), parts };
}

export function coinOutlook(coin, { risk, headlines = [] }) {
  const tones = toneCount(headlines);
  const parts = [
    { label: "Short-term momentum", weight: 0.3, score: clamp(50 + h1(coin) * 10 + d1(coin) * 3), detail: `1h ${formatPercent(h1(coin))} · 24h ${formatPercent(d1(coin))}` },
    { label: "Weekly trend", weight: 0.25, score: clamp(50 + w1(coin) * 3), detail: `7d ${formatPercent(w1(coin))}` },
    {
      label: "Volume",
      weight: 0.15,
      score: clamp(50 + vol(coin) / 2),
      detail: `${vol(coin) >= 0 ? "Up" : "Down"} ${Math.abs(vol(coin)).toFixed(1)}% vs yesterday`,
    },
    { label: "Stability", weight: 0.15, score: 100 - risk, detail: `${riskBand(risk).label} risk (${risk})` },
    {
      label: "News tone",
      weight: headlines.length ? 0.15 : 0,
      score: headlines.length ? clamp(50 + ((tones.bullish - tones.bearish) / headlines.length) * 50) : 50,
      detail: headlines.length ? `${tones.bullish} bullish · ${tones.bearish} bearish of ${headlines.length} headlines` : "No recent coverage",
    },
  ];
  const score = weigh(parts);
  return { score, label: biasLabel(score), parts };
}

// Favours steady momentum that isn't overheated, liquid markets, lower risk and news coverage.
export function rankCoinOfTheDay(coins, headlines = []) {
  return coins
    .filter((coin) => investable(coin) && plausible(coin))
    .map((coin) => {
      const risk = listRiskScore(coin);
      const turnover = coin.market_cap ? (coin.total_volume / coin.market_cap) * 100 : 0;
      const news = headlines.filter((item) => item.coins?.includes(coin.id));
      const momentum = clamp(w1(coin), -20, 20) * 1.2 + clamp(d1(coin), -10, 10) * 1.5;
      const heat = w1(coin) > 25 ? (w1(coin) - 25) * 1.5 : 0;
      const score = momentum - heat + Math.min(turnover, 25) * 0.4 - risk * 0.35 + Math.min(news.length, 3) * 4;
      return { coin, score, risk, turnover, news };
    })
    .sort((a, b) => b.score - a.score);
}
