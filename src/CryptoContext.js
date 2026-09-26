import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api/client";
import { CoinList } from "./config/api";
import { mapTicker } from "./utils/market";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

const Crypto = createContext();

const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState("USD");
  const [symbol, setSymbol] = useState("$");
  const [category, setCategory] = useState("all");
  const [rawCoins, setRawCoins] = useState([]);
  const [marketError, setMarketError] = useState("");

  useEffect(() => {
    setSymbol(CURRENCY_SYMBOLS[currency] || "$");
  }, [currency]);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    const load = async () => {
      setMarketError("");
      try {
        const { data } = await api.get(CoinList(category), {
          signal: controller.signal,
          cacheKey: `coins-${category}`,
          cacheTtl: 90000,
        });
        if (!alive) return;
        setRawCoins(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!alive || error.code === "ERR_CANCELED") return;
        setRawCoins([]);
        setMarketError("Market data is busy right now. Wait a moment and refresh.");
      }
    };

    load();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [category]);

  const coins = useMemo(
    () =>
      rawCoins
        .map((ticker) => mapTicker(ticker, currency))
        .filter((coin) => coin.current_price)
        .sort((a, b) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999))
        .slice(0, 100),
    [rawCoins, currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      symbol,
      category,
      setCategory,
      coins,
      marketError,
    }),
    [currency, symbol, category, coins, marketError]
  );

  return <Crypto.Provider value={value}>{children}</Crypto.Provider>;
};

export default CryptoContext;

export const CryptoState = () => useContext(Crypto);
