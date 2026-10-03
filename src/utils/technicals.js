// Technical indicators on candles { t, o, h, l, c, v } (oldest first). Pure functions; series
// helpers return arrays aligned with the input and padded with null until enough data exists.

const lastValid = (series, offset = 0) => {
  let seen = 0;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i] != null && !Number.isNaN(series[i])) {
      if (seen === offset) return series[i];
      seen += 1;
    }
  }
  return null;
};

export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const start = values.findIndex((v) => v != null);
  if (start < 0 || values.length - start < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(start, start + period).reduce((a, b) => a + b, 0) / period;
  out[start + period - 1] = prev;
  for (let i = start + period; i < values.length; i += 1) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

const smaFrom = (values, period) => {
  const start = values.findIndex((v) => v != null);
  if (start < 0) return values.map(() => null);
  return [...new Array(start).fill(null), ...sma(values.slice(start), period)];
};

export function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  const value = () => (gain === 0 && loss === 0 ? 50 : loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
  out[period] = value();
  for (let i = period + 1; i < closes.length; i += 1) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = value();
  }
  return out;
}

export function macd(closes, fast = 12, slow = 26, signal = 9) {
  const f = ema(closes, fast);
  const s = ema(closes, slow);
  const line = closes.map((_, i) => (f[i] != null && s[i] != null ? f[i] - s[i] : null));
  const sig = ema(line, signal);
  const hist = line.map((v, i) => (v != null && sig[i] != null ? v - sig[i] : null));
  return { line, signal: sig, hist };
}

const window = (candles, i, period) => candles.slice(i - period + 1, i + 1);

export function stochastic(candles, period = 14, smooth = 3) {
  const raw = candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = window(candles, i, period);
    const hh = Math.max(...slice.map((x) => x.h));
    const ll = Math.min(...slice.map((x) => x.l));
    return hh === ll ? 50 : ((c.c - ll) / (hh - ll)) * 100;
  });
  const k = smaFrom(raw, smooth);
  return { k, d: smaFrom(k, smooth) };
}

export function williamsR(candles, period = 14) {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = window(candles, i, period);
    const hh = Math.max(...slice.map((x) => x.h));
    const ll = Math.min(...slice.map((x) => x.l));
    return hh === ll ? -50 : ((hh - c.c) / (hh - ll)) * -100;
  });
}

export function cci(candles, period = 20) {
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  const mean = sma(tp, period);
  return tp.map((value, i) => {
    if (mean[i] == null) return null;
    const dev = tp.slice(i - period + 1, i + 1).reduce((sum, x) => sum + Math.abs(x - mean[i]), 0) / period;
    return dev === 0 ? 0 : (value - mean[i]) / (0.015 * dev);
  });
}

export function roc(closes, period = 12) {
  return closes.map((c, i) => (i >= period && closes[i - period] ? (c / closes[i - period] - 1) * 100 : null));
}

const trueRange = (candles) =>
  candles.map((c, i) => (i === 0 ? c.h - c.l : Math.max(c.h - c.l, Math.abs(c.h - candles[i - 1].c), Math.abs(c.l - candles[i - 1].c))));

export function atr(candles, period = 14) {
  const tr = trueRange(candles);
  const out = new Array(candles.length).fill(null);
  if (candles.length <= period) return out;
  let prev = tr.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = prev;
  for (let i = period + 1; i < candles.length; i += 1) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

// Wilder's ADX with +DI / -DI.
export function adx(candles, period = 14) {
  const n = candles.length;
  const out = { adx: new Array(n).fill(null), plus: new Array(n).fill(null), minus: new Array(n).fill(null) };
  if (n <= period * 2) return out;
  const tr = trueRange(candles);
  let sTr = 0;
  let sPlus = 0;
  let sMinus = 0;
  const dx = new Array(n).fill(null);
  for (let i = 1; i < n; i += 1) {
    const up = candles[i].h - candles[i - 1].h;
    const down = candles[i - 1].l - candles[i].l;
    const plusDM = up > down && up > 0 ? up : 0;
    const minusDM = down > up && down > 0 ? down : 0;
    if (i <= period) {
      sTr += tr[i];
      sPlus += plusDM;
      sMinus += minusDM;
    } else {
      sTr = sTr - sTr / period + tr[i];
      sPlus = sPlus - sPlus / period + plusDM;
      sMinus = sMinus - sMinus / period + minusDM;
    }
    if (i >= period && sTr > 0) {
      const p = (100 * sPlus) / sTr;
      const m = (100 * sMinus) / sTr;
      out.plus[i] = p;
      out.minus[i] = m;
      dx[i] = p + m === 0 ? 0 : (100 * Math.abs(p - m)) / (p + m);
    }
  }
  let prev = null;
  for (let i = period * 2 - 1; i < n; i += 1) {
    if (prev == null) {
      const seed = dx.slice(period, period * 2).filter((v) => v != null);
      prev = seed.reduce((a, b) => a + b, 0) / (seed.length || 1);
    } else {
      prev = (prev * (period - 1) + dx[i]) / period;
    }
    out.adx[i] = prev;
  }
  return out;
}

export function bollinger(closes, period = 20, mult = 2) {
  const mid = sma(closes, period);
  return closes.map((c, i) => {
    if (mid[i] == null) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((sum, x) => sum + (x - mid[i]) ** 2, 0) / period);
    const upper = mid[i] + mult * sd;
    const lower = mid[i] - mult * sd;
    return { upper, mid: mid[i], lower, percentB: upper === lower ? 0.5 : (c - lower) / (upper - lower) };
  });
}

export function mfi(candles, period = 14) {
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  return candles.map((_, i) => {
    if (i < period) return null;
    let pos = 0;
    let neg = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      const flow = tp[j] * candles[j].v;
      if (tp[j] > tp[j - 1]) pos += flow;
      else if (tp[j] < tp[j - 1]) neg += flow;
    }
    return neg === 0 ? 100 : 100 - 100 / (1 + pos / neg);
  });
}

export function pivotLevels({ h, l, c }) {
  const p = (h + l + c) / 3;
  const range = h - l;
  return {
    classic: { r3: h + 2 * (p - l), r2: p + range, r1: 2 * p - l, p, s1: 2 * p - h, s2: p - range, s3: l - 2 * (h - p) },
    fibonacci: { r3: p + range, r2: p + 0.618 * range, r1: p + 0.382 * range, p, s1: p - 0.382 * range, s2: p - 0.618 * range, s3: p - range },
    camarilla: {
      r3: c + (range * 1.1) / 4,
      r2: c + (range * 1.1) / 6,
      r1: c + (range * 1.1) / 12,
      p,
      s1: c - (range * 1.1) / 12,
      s2: c - (range * 1.1) / 6,
      s3: c - (range * 1.1) / 4,
    },
  };
}

export const RATINGS = ["Strong sell", "Sell", "Hold", "Buy", "Strong buy"];

// score is (buy − sell) / votes, from −1 to 1 (TradingView-style thresholds).
export function ratingOf(score) {
  if (score >= 0.5) return "Strong buy";
  if (score >= 0.1) return "Buy";
  if (score > -0.1) return "Hold";
  if (score > -0.5) return "Sell";
  return "Strong sell";
}

const tally = (rows) =>
  rows.reduce((acc, row) => ({ ...acc, [row.signal]: acc[row.signal] + 1 }), { buy: 0, neutral: 0, sell: 0 });
const scoreOf = ({ buy, neutral, sell }) => (buy + neutral + sell ? (buy - sell) / (buy + neutral + sell) : 0);

export const MA_PERIODS = [5, 10, 20, 50, 100, 200];

// Moneycontrol/TradingView-style vote: each moving average and oscillator says buy, sell or neutral.
// `ohlc: false` (close-only history) skips indicators that need highs and lows.
export function technicalSummary(candles, { ohlc = true } = {}) {
  if (!candles || candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const price = closes[closes.length - 1];
  const side = (above) => (above ? "buy" : "sell");

  const movingAverages = MA_PERIODS.map((period) => {
    const simple = lastValid(sma(closes, period));
    const exponential = lastValid(ema(closes, period));
    return {
      period,
      simple: simple == null ? null : { value: simple, signal: side(price > simple) },
      exponential: exponential == null ? null : { value: exponential, signal: side(price > exponential) },
    };
  }).filter((row) => row.simple || row.exponential);
  const maVotes = movingAverages.flatMap((row) => [row.simple, row.exponential].filter(Boolean));

  const oscillators = [];
  const r = lastValid(rsi(closes));
  if (r != null) {
    oscillators.push({
      name: "RSI (14)",
      value: r,
      signal: r < 30 ? "buy" : r > 70 ? "sell" : "neutral",
      note: r < 30 ? "Oversold" : r > 70 ? "Overbought" : r >= 50 ? "Bullish zone" : "Bearish zone",
    });
  }
  const m = macd(closes);
  const ml = lastValid(m.line);
  const ms = lastValid(m.signal);
  if (ml != null && ms != null) {
    oscillators.push({ name: "MACD (12, 26, 9)", value: ml, price: true, signal: side(ml > ms), note: ml > ms ? "Above signal line" : "Below signal line" });
  }
  const momentum = lastValid(roc(closes));
  if (momentum != null) {
    oscillators.push({ name: "Rate of change (12)", value: momentum, suffix: "%", signal: side(momentum > 0), note: momentum > 0 ? "Positive momentum" : "Negative momentum" });
  }
  const band = bollinger(closes);
  const pb = band[band.length - 1]?.percentB;
  if (pb != null) {
    oscillators.push({
      name: "Bollinger %B (20, 2)",
      value: pb * 100,
      suffix: "%",
      signal: pb < 0.05 ? "buy" : pb > 0.95 ? "sell" : "neutral",
      note: pb < 0.05 ? "At lower band" : pb > 0.95 ? "At upper band" : "Inside the bands",
    });
  }
  if (ohlc) {
    const k = lastValid(stochastic(candles).k);
    if (k != null) {
      oscillators.push({ name: "Stochastic %K (14, 3)", value: k, signal: k < 20 ? "buy" : k > 80 ? "sell" : "neutral", note: k < 20 ? "Oversold" : k > 80 ? "Overbought" : "Neutral" });
    }
    const w = lastValid(williamsR(candles));
    if (w != null) {
      oscillators.push({ name: "Williams %R (14)", value: w, signal: w < -80 ? "buy" : w > -20 ? "sell" : "neutral", note: w < -80 ? "Oversold" : w > -20 ? "Overbought" : "Neutral" });
    }
    const commodity = lastValid(cci(candles));
    if (commodity != null) {
      oscillators.push({
        name: "CCI (20)",
        value: commodity,
        signal: commodity < -100 ? "buy" : commodity > 100 ? "sell" : "neutral",
        note: commodity < -100 ? "Oversold" : commodity > 100 ? "Overbought" : "Neutral",
      });
    }
    const trend = adx(candles);
    const a = lastValid(trend.adx);
    const plus = lastValid(trend.plus);
    const minus = lastValid(trend.minus);
    if (a != null && plus != null && minus != null) {
      oscillators.push({
        name: "ADX (14)",
        value: a,
        signal: a < 20 ? "neutral" : side(plus > minus),
        note: a < 20 ? "No clear trend" : `${a >= 40 ? "Very strong" : "Strong"} ${plus > minus ? "uptrend" : "downtrend"}`,
      });
    }
    const flow = lastValid(mfi(candles));
    if (flow != null && candles.some((c) => c.v > 0)) {
      oscillators.push({ name: "Money flow index (14)", value: flow, signal: flow < 20 ? "buy" : flow > 80 ? "sell" : "neutral", note: flow < 20 ? "Oversold" : flow > 80 ? "Overbought" : "Neutral" });
    }
  }

  const counts = { ma: tally(maVotes), osc: tally(oscillators) };
  counts.total = { buy: counts.ma.buy + counts.osc.buy, neutral: counts.ma.neutral + counts.osc.neutral, sell: counts.ma.sell + counts.osc.sell };
  const score = oscillators.length ? (scoreOf(counts.ma) + scoreOf(counts.osc)) / 2 : scoreOf(counts.ma);
  return { price, movingAverages, oscillators, counts, score, rating: ratingOf(score) };
}

export function periodReturn(candles, days) {
  if (!candles || candles.length <= days) return null;
  const now = candles[candles.length - 1].c;
  const then = candles[candles.length - 1 - days].c;
  return then ? (now / then - 1) * 100 : null;
}

// Volatility cone: ±1σ of daily log returns scaled by √days (≈68% of outcomes if volatility holds).
export function expectedRange(candles, days, lookback = 30) {
  if (!candles || candles.length < lookback + 1) return null;
  const closes = candles.slice(-(lookback + 1)).map((c) => c.c);
  const rets = closes.slice(1).map((c, i) => Math.log(c / closes[i]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (rets.length - 1));
  const price = closes[closes.length - 1];
  const move = sd * Math.sqrt(days);
  return { low: price * Math.exp(-move), high: price * Math.exp(move), pct: (Math.exp(move) - 1) * 100, dailyVol: sd * 100 };
}

const crossed = (a, b, i) =>
  a[i - 1] != null && b[i - 1] != null && a[i] != null && b[i] != null && a[i] !== b[i] && Math.sign(a[i] - b[i]) !== Math.sign(a[i - 1] - b[i - 1]);

// Crossovers and RSI extremes over the last `lookback` candles, newest first.
export function signalEvents(candles, lookback = 120) {
  if (!candles || candles.length < 30) return [];
  const closes = candles.map((c) => c.c);
  const fifty = sma(closes, 50);
  const twoHundred = sma(closes, 200);
  const m = macd(closes);
  const r = rsi(closes);
  const events = [];
  for (let i = Math.max(1, candles.length - lookback); i < candles.length; i += 1) {
    const t = candles[i].t;
    if (crossed(m.line, m.signal, i)) {
      const up = m.line[i] > m.signal[i];
      events.push({ t, tone: up ? "bull" : "bear", title: up ? "MACD bullish crossover" : "MACD bearish crossover" });
    }
    if (crossed(fifty, twoHundred, i)) {
      const up = fifty[i] > twoHundred[i];
      events.push({ t, tone: up ? "bull" : "bear", title: up ? "Golden cross (50-day above 200-day)" : "Death cross (50-day below 200-day)" });
    }
    if (crossed(closes, twoHundred, i)) {
      const up = closes[i] > twoHundred[i];
      events.push({ t, tone: up ? "bull" : "bear", title: up ? "Price climbed above the 200-day average" : "Price fell below the 200-day average" });
    } else if (crossed(closes, fifty, i)) {
      const up = closes[i] > fifty[i];
      events.push({ t, tone: up ? "bull" : "bear", title: up ? "Price reclaimed the 50-day average" : "Price slipped below the 50-day average" });
    }
    if (r[i - 1] != null && r[i] != null) {
      if (r[i - 1] >= 30 && r[i] < 30) events.push({ t, tone: "watch", title: "RSI turned oversold — bounce watch" });
      if (r[i - 1] <= 70 && r[i] > 70) events.push({ t, tone: "warn", title: "RSI turned overbought — pullback risk" });
    }
  }
  return events.reverse();
}

// If the current pace holds: days until the MACD histogram or the 50/200-day gap crosses zero.
export function projections(candles) {
  if (!candles || candles.length < 40) return [];
  const closes = candles.map((c) => c.c);
  const out = [];
  const { hist } = macd(closes);
  const h0 = lastValid(hist);
  const h1 = lastValid(hist, 1);
  if (h0 != null && h1 != null && h0 !== h1) {
    const slope = h0 - h1;
    if (h0 < 0 && slope > 0) out.push({ tone: "bull", days: Math.ceil(-h0 / slope), title: "Bullish MACD crossover", detail: "Selling momentum is fading" });
    if (h0 > 0 && slope < 0) out.push({ tone: "bear", days: Math.ceil(h0 / -slope), title: "Bearish MACD crossover", detail: "Buying momentum is fading" });
  }
  const fifty = sma(closes, 50);
  const twoHundred = sma(closes, 200);
  const n = closes.length - 1;
  if (fifty[n] != null && twoHundred[n] != null && fifty[n - 5] != null && twoHundred[n - 5] != null) {
    const gap = fifty[n] - twoHundred[n];
    const slope = (gap - (fifty[n - 5] - twoHundred[n - 5])) / 5;
    if (gap < 0 && slope > 0) out.push({ tone: "bull", days: Math.ceil(-gap / slope), title: "Golden cross", detail: "The 50-day average is closing in on the 200-day" });
    if (gap > 0 && slope < 0) out.push({ tone: "bear", days: Math.ceil(gap / -slope), title: "Death cross", detail: "The 50-day average is sliding toward the 200-day" });
  }
  return out.filter((p) => p.days > 0 && p.days <= 60).sort((a, b) => a.days - b.days);
}

// Nearest levels above/below price: closing beyond them is the bull/bear trigger.
export function triggerLevels(candles, pivots) {
  if (!candles || candles.length < 20) return { bull: [], bear: [] };
  const closes = candles.map((c) => c.c);
  const price = closes[closes.length - 1];
  const recent = candles.slice(-21, -1);
  const year = candles.slice(-366, -1);
  const levels = [
    pivots && { label: "Pivot R1", value: pivots.classic.r1 },
    pivots && { label: "Pivot R2", value: pivots.classic.r2 },
    pivots && { label: "Pivot S1", value: pivots.classic.s1 },
    pivots && { label: "Pivot S2", value: pivots.classic.s2 },
    { label: "20-day high", value: Math.max(...recent.map((c) => c.h)) },
    { label: "20-day low", value: Math.min(...recent.map((c) => c.l)) },
    { label: "20-day average", value: lastValid(sma(closes, 20)) },
    { label: "50-day average", value: lastValid(sma(closes, 50)) },
    { label: "200-day average", value: lastValid(sma(closes, 200)) },
    year.length > 200 && { label: "52-week high", value: Math.max(...year.map((c) => c.h)) },
    year.length > 200 && { label: "52-week low", value: Math.min(...year.map((c) => c.l)) },
  ].filter((level) => level && level.value != null && Number.isFinite(level.value));
  return {
    price,
    bull: levels.filter((level) => level.value > price * 1.001).sort((a, b) => a.value - b.value),
    bear: levels.filter((level) => level.value < price * 0.999).sort((a, b) => b.value - a.value),
  };
}

// How well the coin suits each holding period, from volatility, trend strength and maturity.
export function horizonFit(kind, { daily, coin }) {
  if (!daily || daily.length < 30) return { level: "fair", text: "Not enough price history to judge yet" };
  const price = daily[daily.length - 1].c;
  const atrPct = ((lastValid(atr(daily)) || 0) / price) * 100;
  const turnover = coin.market_cap ? (coin.total_volume / coin.market_cap) * 100 : 0;
  if (kind === "short") {
    if (atrPct > 9) return { level: "fair", text: `Very volatile (≈${atrPct.toFixed(1)}% daily swings) — use tight risk limits` };
    if (atrPct >= 2 && turnover >= 2) return { level: "good", text: `Liquid with ≈${atrPct.toFixed(1)}% daily swings — suits active traders` };
    if (atrPct < 1.2) return { level: "poor", text: "Moves slowly — little room for short-term trades" };
    return { level: "fair", text: `≈${atrPct.toFixed(1)}% daily swings — tradeable, but check liquidity` };
  }
  if (kind === "medium") {
    const trend = adx(daily);
    const a = lastValid(trend.adx);
    if (a == null) return { level: "fair", text: "Trend strength unavailable for this data source" };
    const up = lastValid(trend.plus) > lastValid(trend.minus);
    if (a >= 25) return { level: up ? "good" : "fair", text: `Clear ${up ? "uptrend" : "downtrend"} (ADX ${a.toFixed(0)}) — ${up ? "suits swing positions" : "wait for it to turn"}` };
    if (a < 18) return { level: "poor", text: `Choppy, trendless market (ADX ${a.toFixed(0)}) — wait for a breakout` };
    return { level: "fair", text: `Trend still forming (ADX ${a.toFixed(0)}) — confirm before sizing up` };
  }
  const years = coin.first_data_at ? (Date.now() - Date.parse(coin.first_data_at)) / 31557600000 : 0;
  const rank = coin.market_cap_rank || 999;
  if (rank <= 20 && years >= 4) return { level: "good", text: `Established top-${rank <= 10 ? 10 : 20} coin with ${Math.floor(years)}+ years of history` };
  if (rank <= 50 || years >= 3) return { level: "fair", text: `${rank <= 50 ? "Mid-size" : "Smaller"} project with ${Math.max(1, Math.floor(years))}+ years of history — size positions carefully` };
  return { level: "poor", text: "Small or young project — higher long-term risk" };
}

// Daily → weekly candles, bucketed from the newest day backwards.
export function toWeekly(daily) {
  const weeks = [];
  for (let end = daily.length; end > 0; end -= 7) {
    const slice = daily.slice(Math.max(0, end - 7), end);
    weeks.unshift({
      t: slice[0].t,
      o: slice[0].o,
      h: Math.max(...slice.map((c) => c.h)),
      l: Math.min(...slice.map((c) => c.l)),
      c: slice[slice.length - 1].c,
      v: slice.reduce((sum, c) => sum + c.v, 0),
    });
  }
  return weeks;
}
