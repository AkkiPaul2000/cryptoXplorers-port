import { coinOutlook, investable, isPegged, marketOutlook, rankCoinOfTheDay, signalGroups } from "./signals";
import { coinMatchers, mentionedCoins, tagHeadline } from "./rss";

const coin = (id, symbol, name, h, d, w, extra = {}) => ({
  id,
  symbol,
  name,
  market_cap_rank: 5,
  market_cap: 1e10,
  total_volume: 1e9,
  volume_change_24h: 0,
  price_change_percentage_1h: h,
  price_change_percentage_24h: d,
  price_change_percentage_7d_in_currency: w,
  ...extra,
});

test("signals, outlooks and coin-of-the-day ranking", () => {
  const coins = [
    coin("usdt-tether", "USDT", "Tether", 0, 0.01, 0.02),
    coin("steth-lido-staked-ether", "STETH", "Lido Staked Ether", 1, 5, 9),
    coin("brk-breakout", "BRK", "Breakout", 0.8, 6, 4, { volume_change_24h: 60 }),
    coin("reb-rebound", "REB", "Rebound", 0.2, 2, -12),
    coin("hot-overheated", "HOT", "Overheated", -0.5, 3, 40),
    coin("cal-calm", "CAL", "Calm", 0.1, 0.8, 3),
    coin("ftm-glitch", "FTM", "Glitch", 0.1, 0.4, 1010),
  ];
  expect(investable(coins[0])).toBe(false);
  expect(investable(coins[1])).toBe(false);
  expect(isPegged(coins[0])).toBe(true);
  expect(isPegged(coin("susde-ethena-staked-usde", "SUSDE", "Ethena Staked USDe", 0, 0, 0))).toBe(false);
  expect(isPegged(coin("xaut-tether-gold", "XAUT", "Tether Gold", 0, 0, 0))).toBe(false);

  const groups = Object.fromEntries(signalGroups(coins).map((g) => [g.key, g.coins.map((c) => c.coin.id)]));
  expect(groups.breakout).toEqual(["brk-breakout"]);
  expect(groups.rebound).toEqual(["reb-rebound"]);
  expect(groups.overheated).toEqual(["hot-overheated"]); // the +1010% data glitch is ignored
  expect(groups.steady).toContain("cal-calm");

  const outlook = marketOutlook({ coins, fearGreed: 80, headlines: [] });
  expect(outlook.score).toBeGreaterThan(55);
  expect(coinOutlook(coins[4], { risk: 90 }).label).toMatch(/bull|neutral/i);

  // Breakout leads on momentum; the overheated coin is penalised despite a +40% week.
  expect(rankCoinOfTheDay(coins)[0].coin.id).toBe("brk-breakout");

  const headline = tagHeadline({ title: "Bitcoin ETF inflows surge as BTC hits record", summary: "" });
  expect(headline.tone).toBe("bullish");
  expect(headline.topics).toContain("etf");
  const matchers = coinMatchers([coin("btc-bitcoin", "BTC", "Bitcoin", 0, 0, 0), coin("sol-solana", "SOL", "Solana", 0, 0, 0)]);
  expect(mentionedCoins(headline, matchers)).toEqual(["btc-bitcoin"]);
});
