import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { isRateLimited } from "./api/client";
import { CoinList, TagCoins } from "./config/api";
import { mapTicker } from "./utils/market";
import { readStored, writeStored } from "./utils/storage";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

// ponytail: /tickers is ~3.6MB and CoinPaprika's free plan allows 60 requests an hour (its data
// updates about every 5 minutes anyway), so poll every 5 minutes and only while the tab is visible.
const REFRESH_MS = 300000;

const Crypto = createContext();

const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const stored = readStored("crx-currency", "USD");
    return CURRENCY_SYMBOLS[stored] ? stored : "USD";
  });
  const [rawCoins, setRawCoins] = useState([]);
  const [marketError, setMarketError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tick, setTick] = useState(0);
  const [category, setCategory] = useState("all");
  const [categoryIds, setCategoryIds] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [watchlist, setWatchlist] = useState(() => {
    const stored = readStored("crx-watchlist", []);
    return Array.isArray(stored) ? stored : [];
  });
  const loaded = useRef(false);
  const forceFresh = useRef(false);
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  useEffect(() => writeStored("crx-currency", currency), [currency]);
  useEffect(() => writeStored("crx-watchlist", watchlist), [watchlist]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((value) => value + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const background = loaded.current;
    const fresh = forceFresh.current;
    forceFresh.current = false;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setMarketError("");
    }

    api
      .get(CoinList(), { signal: controller.signal, cacheKey: "coins", cacheTtl: 90000, fresh, silent: background })
      .then(({ data }) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data : [];
        const newest = rows.reduce((max, row) => Math.max(max, Date.parse(row.last_updated) || 0), 0);
        loaded.current = true;
        setRawCoins(rows);
        setMarketError("");
        setLastUpdated(newest || Date.now());
      })
      .catch((error) => {
        if (!alive || error.code === "ERR_CANCELED" || background) return;
        setMarketError(
          isRateLimited(error)
            ? "Live prices are paused: CoinPaprika's free plan allows 60 requests an hour. They'll resume automatically shortly."
            : "Market data is busy right now. Wait a moment and refresh."
        );
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [tick]);

  useEffect(() => {
    setCategoryError("");
    if (category === "all") {
      setCategoryIds(null);
      setCategoryLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    let alive = true;
    setCategoryLoading(true);
    api
      .get(TagCoins(category), { signal: controller.signal, cacheKey: `tag-${category}`, cacheTtl: 3600000 })
      .then(({ data }) => alive && setCategoryIds(new Set(Array.isArray(data?.coins) ? data.coins : [])))
      .catch((error) => {
        if (!alive || error.code === "ERR_CANCELED") return;
        setCategoryIds(new Set());
        setCategoryError("This category couldn't be loaded. Try again in a moment.");
      })
      .finally(() => alive && setCategoryLoading(false));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [category]);

  const refresh = useCallback(() => {
    forceFresh.current = true;
    setTick((value) => value + 1);
  }, []);

  const toggleWatch = useCallback(
    (id) =>
      setWatchlist((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id])),
    []
  );

  // Every listed coin, used by search; the dashboards work with the top 100.
  const allCoins = useMemo(
    () =>
      rawCoins
        .map((ticker) => mapTicker(ticker, currency))
        .filter((coin) => coin.current_price)
        .sort((a, b) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999)),
    [rawCoins, currency]
  );
  const coins = useMemo(() => allCoins.slice(0, 100), [allCoins]);
  // Raw tickers by id, so coin pages can skip refetching a ticker we already have.
  const tickerById = useMemo(() => new Map(rawCoins.map((ticker) => [ticker.id, ticker])), [rawCoins]);
  const screenerCoins = useMemo(
    () => (categoryIds ? allCoins.filter((coin) => categoryIds.has(coin.id)).slice(0, 100) : coins),
    [allCoins, coins, categoryIds]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      symbol,
      allCoins,
      coins,
      tickerById,
      screenerCoins,
      category,
      setCategory,
      categoryLoading,
      categoryError,
      marketError,
      loading,
      refreshing,
      lastUpdated,
      refresh,
      watchlist,
      toggleWatch,
    }),
    [
      currency,
      symbol,
      allCoins,
      coins,
      tickerById,
      screenerCoins,
      category,
      categoryLoading,
      categoryError,
      marketError,
      loading,
      refreshing,
      lastUpdated,
      refresh,
      watchlist,
      toggleWatch,
    ]
  );

  return <Crypto.Provider value={value}>{children}</Crypto.Provider>;
};

export default CryptoContext;

export const CryptoState = () => useContext(Crypto);
