import {
  ema,
  expectedRange,
  pivotLevels,
  projections,
  ratingOf,
  rsi,
  signalEvents,
  sma,
  technicalSummary,
  toWeekly,
  triggerLevels,
} from "./technicals";

const DAY = 86400000;
const candlesFrom = (closes) =>
  closes.map((c, i) => ({ t: i * DAY, o: c, h: c * 1.01, l: c * 0.99, c, v: 1000 + i }));

test("indicator math, ratings, levels and events", () => {
  expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  expect(ema([2, 4, 6, 8], 2)).toEqual([null, 3, 5, 7]);
  expect(rsi([1, 2, 3, 4, 5, 6], 3)[5]).toBe(100); // only gains
  expect(rsi([5, 5, 5, 5, 5], 3)[4]).toBe(50); // flat price is neutral, not 100

  const p = pivotLevels({ h: 110, l: 90, c: 100 });
  expect(p.classic.p).toBe(100);
  expect(p.classic.r1).toBe(110);
  expect(p.classic.s1).toBe(90);
  expect(p.fibonacci.r3).toBe(120);

  expect(ratingOf(0.6)).toBe("Strong buy");
  expect(ratingOf(0)).toBe("Hold");
  expect(ratingOf(-0.3)).toBe("Sell");

  // A steady 250-day uptrend: every moving average says buy.
  const up = candlesFrom(Array.from({ length: 250 }, (_, i) => 100 + i));
  const summary = technicalSummary(up);
  expect(summary.counts.ma.sell).toBe(0);
  expect(["Buy", "Strong buy"]).toContain(summary.rating);
  expect(technicalSummary(up.slice(0, 10))).toBeNull();

  // Accelerating 220-day decline, then a sharp recovery: price crosses back above its averages.
  const vee = candlesFrom([
    ...Array.from({ length: 220 }, (_, i) => 400 - i * 0.5 - (i * i) / 300),
    ...Array.from({ length: 60 }, (_, i) => 131 + i * 6),
  ]);
  const titles = signalEvents(vee).map((e) => e.title);
  expect(titles).toContain("MACD bullish crossover");
  expect(titles.some((t) => t.startsWith("Price climbed above the 200-day"))).toBe(true);

  const levels = triggerLevels(vee, pivotLevels(vee[vee.length - 2]));
  expect(levels.bull.every((l) => l.value > levels.price)).toBe(true);
  expect(levels.bear.every((l) => l.value < levels.price)).toBe(true);

  const range = expectedRange(up, 7);
  expect(range.low).toBeLessThan(up[up.length - 1].c);
  expect(range.high).toBeGreaterThan(up[up.length - 1].c);

  // Accelerating sell-off that suddenly slows: MACD histogram still negative but rising.
  const fading = candlesFrom([
    ...Array.from({ length: 80 }, (_, i) => 300 - 0.02 * i * i),
    ...Array.from({ length: 2 }, (_, i) => 300 - 0.02 * 79 * 79 - 0.3 * (i + 1)),
  ]);
  expect(projections(fading)[0]).toMatchObject({ title: "Bullish MACD crossover", days: 3 });

  expect(toWeekly(up.slice(0, 14))).toHaveLength(2);
});
