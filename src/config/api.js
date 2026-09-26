export const CoinList = (tag = "all") =>
  tag && tag !== "all"
    ? `/paprika/v1/tags/${tag}/tickers?quotes=USD,INR,EUR`
    : `/paprika/v1/tickers?quotes=USD,INR,EUR`;

export const SingleTicker = (id) =>
  `/paprika/v1/tickers/${id}?quotes=USD,INR,EUR`;

export const CoinProfile = (id) => `/paprika/v1/coins/${id}`;

export const CoinMarkets = (id) => `/paprika/v1/coins/${id}/markets`;

export const TodayOhlc = (id) => `/paprika/v1/coins/${id}/ohlcv/today`;

export const GlobalData = () => `/paprika/v1/global`;

export const FearGreed = () => `/sentiment/fng/?limit=1`;

export const BitcoinStats = () => `/btc/stats`;

export const chartRequest = (days) => {
  if (days <= 1) return { interval: "15m", limit: 96 };
  if (days <= 7) return { interval: "1h", limit: 168 };
  if (days <= 30) return { interval: "4h", limit: 180 };
  if (days <= 90) return { interval: "1d", limit: 90 };
  return { interval: "1d", limit: 365 };
};

export const BinanceKlines = (symbol, days) => {
  const { interval, limit } = chartRequest(days);
  return `/binance/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;
};

export const BinanceDepth = (symbol) =>
  `/binance/api/v3/depth?symbol=${symbol}USDT&limit=500`;

export const CoinEvents = (id) => `/paprika/v1/coins/${id}/events`;

export const CoinTwitter = (id) => `/paprika/v1/coins/${id}/twitter`;

export const RssCoinTelegraph = () => "/rss/cointelegraph";

export const RssCoinDesk = () => "/rss/coindesk";
