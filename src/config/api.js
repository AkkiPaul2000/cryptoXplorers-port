export const CoinList = () => `/paprika/v1/tickers?quotes=USD,INR,EUR`;

// CoinPaprika has no per-tag tickers endpoint; the tag itself lists its coin ids.
export const TagCoins = (tag) => `/paprika/v1/tags/${tag}?additional_fields=coins`;

export const SingleTicker = (id) =>
  `/paprika/v1/tickers/${id}?quotes=USD,INR,EUR`;

export const CoinProfile = (id) => `/paprika/v1/coins/${id}`;

export const CoinMarkets = (id) => `/paprika/v1/coins/${id}/markets`;

export const TodayOhlc = (id) => `/paprika/v1/coins/${id}/ohlcv/today`;

export const GlobalData = () => `/paprika/v1/global`;

// Free plan: hourly points for the last 24 hours only, daily points for up to a year.
export const PaprikaHistory = (id, days) => {
  if (days <= 1) return `/paprika/v1/tickers/${id}/historical?start=${Math.floor(Date.now() / 1000) - 86000}&interval=1h`;
  const start = new Date(Date.now() - Math.min(days, 364) * 86400000).toISOString().slice(0, 10);
  return `/paprika/v1/tickers/${id}/historical?start=${start}&interval=1d`;
};

export const FearGreed = (limit = 1) => `/sentiment/fng/?limit=${limit}`;

export const BitcoinStats = () => `/btc/stats`;

export const chartRequest = (days) => {
  if (days <= 1) return { interval: "15m", limit: 96 };
  if (days <= 7) return { interval: "1h", limit: 168 };
  if (days <= 30) return { interval: "4h", limit: 180 };
  if (days <= 90) return { interval: "1d", limit: 90 };
  if (days <= 365) return { interval: "1d", limit: 365 };
  return { interval: "1w", limit: 520 };
};

export const BinanceCandles = (symbol, interval, limit) =>
  `/binance/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;

export const BinanceKlines = (symbol, days) => {
  const { interval, limit } = chartRequest(days);
  return `/binance/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;
};

// startTime makes delisted pairs (e.g. XMR) come back empty instead of replaying their last week on Binance.
export const BinanceSpark = (symbol) =>
  `/binance/api/v3/klines?symbol=${symbol}USDT&interval=4h&limit=42&startTime=${Date.now() - 7 * 86400000}`;

export const BinanceDepth = (symbol) =>
  `/binance/api/v3/depth?symbol=${symbol}USDT&limit=500`;

export const CoinEvents = (id) => `/paprika/v1/coins/${id}/events`;

export const CoinTwitter = (id) => `/paprika/v1/coins/${id}/twitter`;

export const RssCoinTelegraph = () => "/rss/cointelegraph";

export const RssCoinDesk = () => "/rss/coindesk";
