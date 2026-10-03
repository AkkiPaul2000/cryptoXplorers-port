// These APIs send CORS headers, so the browser calls them directly. The RSS feeds don't: the dev server
// proxies them (setupProxy.js) and the GitHub Pages workflow snapshots them into the build.
export const CoinList = () => `https://api.coinpaprika.com/v1/tickers?quotes=USD,INR,EUR`;

// CoinPaprika has no per-tag tickers endpoint; the tag itself lists its coin ids.
export const TagCoins = (tag) => `https://api.coinpaprika.com/v1/tags/${tag}?additional_fields=coins`;

export const SingleTicker = (id) =>
  `https://api.coinpaprika.com/v1/tickers/${id}?quotes=USD,INR,EUR`;

export const CoinProfile = (id) => `https://api.coinpaprika.com/v1/coins/${id}`;

export const CoinMarkets = (id) => `https://api.coinpaprika.com/v1/coins/${id}/markets`;

export const TodayOhlc = (id) => `https://api.coinpaprika.com/v1/coins/${id}/ohlcv/today`;

export const GlobalData = () => `https://api.coinpaprika.com/v1/global`;

// Free plan: hourly points for the last 24 hours only, daily points for up to a year.
export const PaprikaHistory = (id, days) => {
  if (days <= 1) return `https://api.coinpaprika.com/v1/tickers/${id}/historical?start=${Math.floor(Date.now() / 1000) - 86000}&interval=1h`;
  const start = new Date(Date.now() - Math.min(days, 364) * 86400000).toISOString().slice(0, 10);
  return `https://api.coinpaprika.com/v1/tickers/${id}/historical?start=${start}&interval=1d`;
};

export const FearGreed = (limit = 1) => `https://api.alternative.me/fng/?limit=${limit}`;

export const BitcoinStats = () => `https://api.blockchain.info/stats`;

export const chartRequest = (days) => {
  if (days <= 1) return { interval: "15m", limit: 96 };
  if (days <= 7) return { interval: "1h", limit: 168 };
  if (days <= 30) return { interval: "4h", limit: 180 };
  if (days <= 90) return { interval: "1d", limit: 90 };
  if (days <= 365) return { interval: "1d", limit: 365 };
  return { interval: "1w", limit: 520 };
};

export const BinanceCandles = (symbol, interval, limit) =>
  `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;

export const BinanceKlines = (symbol, days) => {
  const { interval, limit } = chartRequest(days);
  return `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;
};

// startTime makes delisted pairs (e.g. XMR) come back empty instead of replaying their last week on Binance.
export const BinanceSpark = (symbol) =>
  `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}USDT&interval=4h&limit=42&startTime=${Date.now() - 7 * 86400000}`;

export const BinanceDepth = (symbol) =>
  `https://data-api.binance.vision/api/v3/depth?symbol=${symbol}USDT&limit=500`;

export const CoinEvents = (id) => `https://api.coinpaprika.com/v1/coins/${id}/events`;

export const CoinTwitter = (id) => `https://api.coinpaprika.com/v1/coins/${id}/twitter`;

export const RssCoinTelegraph = () => `${process.env.PUBLIC_URL}/rss/cointelegraph`;

export const RssCoinDesk = () => `${process.env.PUBLIC_URL}/rss/coindesk`;
