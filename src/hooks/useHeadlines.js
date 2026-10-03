import { useMemo, useState } from "react";
import api from "../api/client";
import { RssCoinDesk, RssCoinTelegraph } from "../config/api";
import { CryptoState } from "../CryptoContext";
import { coinMatchers, mentionedCoins, parseRss, tagHeadline } from "../utils/rss";
import { useAbortableEffect } from "./useAbortable";

const FEEDS = [
  [RssCoinTelegraph, "rss-ct", "Cointelegraph"],
  [RssCoinDesk, "rss-cd", "CoinDesk"],
];

// Both feeds, newest first, tagged with topics, tone and the top-100 coins they mention.
export default function useHeadlines() {
  const { coins } = CryptoState();
  const [state, setState] = useState({ items: [], loading: true });

  useAbortableEffect((signal, isAlive) => {
    Promise.all(
      FEEDS.map(([url, cacheKey, source]) =>
        api
          .get(url(), { signal, silent: true, responseType: "text", cacheKey, cacheTtl: 300000 })
          .then(({ data }) => parseRss(data, source))
          .catch(() => [])
      )
    ).then((feeds) => {
      if (!isAlive()) return;
      const seen = new Set();
      const items = feeds
        .flat()
        .filter((item) => item.title && !seen.has(item.title) && seen.add(item.title))
        .map(tagHeadline)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setState({ items, loading: false });
    });
  }, []);

  const items = useMemo(() => {
    const matchers = coinMatchers(coins);
    return state.items.map((item) => ({ ...item, coins: mentionedCoins(item, matchers) }));
  }, [state.items, coins]);

  return { items, loading: state.loading };
}
