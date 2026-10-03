import { useState } from "react";
import api, { isRateLimited } from "../api/client";
import { BinanceCandles, PaprikaHistory } from "../config/api";
import { toWeekly } from "../utils/technicals";
import { useAbortableEffect } from "./useAbortable";

const TEN_MINUTES = 600000;
const ONE_HOUR = 3600000; // CoinPaprika's free plan only allows 60 requests an hour

const fromBinance = (rows) =>
  rows.map((k) => ({ t: k[0], o: Number(k[1]), h: Number(k[2]), l: Number(k[3]), c: Number(k[4]), v: Number(k[7]) }));

// CoinPaprika's free history is close-only, so high and low equal the close.
const fromPaprika = (rows) =>
  rows.map((row) => ({
    t: Date.parse(row.timestamp),
    o: row.price,
    h: row.price,
    l: row.price,
    c: row.price,
    v: row.volume_24h || 0,
    mcap: row.market_cap,
  }));

// Hourly, daily and weekly candles (USD) plus BTC/ETH daily benchmarks. Binance first; coins
// without a {SYMBOL}USDT pair — and stablecoins, whose USD peg matters — use CoinPaprika's year.
export default function useTechnicals(coin, { pegged = false } = {}) {
  const [state, setState] = useState({ loading: true });

  useAbortableEffect(
    (signal, isAlive) => {
      setState({ loading: true });
      const get = (url, cacheKey, cacheTtl = TEN_MINUTES) =>
        api.get(url, { signal, silent: true, cacheKey, cacheTtl }).then(({ data }) => data);
      const binance = (symbol, interval, limit) =>
        get(BinanceCandles(symbol, interval, limit), `candles-${symbol}-${interval}-${limit}`).then(fromBinance);
      const paprika = () => get(PaprikaHistory(coin.id, 365), `history-${coin.id}-1y`, ONE_HOUR).then(fromPaprika);
      const benchmark = (symbol) => (coin.symbol === symbol ? null : binance(symbol, "1d", 400).catch(() => null));

      const load = async () => {
        let source = "binance";
        let daily;
        let hourly = null;
        let weekly = null;
        if (pegged) {
          source = "coinpaprika";
          daily = await paprika();
        } else {
          try {
            [daily, hourly, weekly] = await Promise.all([
              binance(coin.symbol, "1d", 400),
              binance(coin.symbol, "1h", 300).catch(() => null),
              binance(coin.symbol, "1w", 260).catch(() => null),
            ]);
          } catch (error) {
            if (error.code === "ERR_CANCELED") throw error;
            source = "coinpaprika";
            daily = await paprika();
            weekly = toWeekly(daily);
          }
        }
        const [btc, eth] = pegged ? [null, null] : await Promise.all([benchmark("BTC"), benchmark("ETH")]);
        if (isAlive()) setState({ loading: false, source, ohlc: source === "binance", daily, hourly, weekly, btc, eth });
      };

      load().catch((error) => {
        if (isAlive() && error.code !== "ERR_CANCELED") setState({ loading: false, failed: true, limited: isRateLimited(error) });
      });
    },
    [coin.id, coin.symbol, pegged]
  );

  return state;
}
