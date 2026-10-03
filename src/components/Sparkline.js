import React, { useId, useState } from "react";
import { Skeleton } from "@mui/material";
import api from "../api/client";
import { BinanceSpark } from "../config/api";
import { useAbortableEffect } from "../hooks/useAbortable";
import { tokens } from "../theme/theme";

export function Sparkline({ prices = [], width = 110, height = 36, color }) {
  const id = `spark-${useId().replace(/:/g, "")}`;
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const points = prices.map((price, index) => [
    (index / (prices.length - 1)) * width,
    height - 2 - ((price - min) / span) * (height - 4),
  ]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = color || (prices[prices.length - 1] >= prices[0] ? tokens.up : tokens.down);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${id})`} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={line}
      />
    </svg>
  );
}

// Rows mount top-down, so one small FIFO fills the table in row order instead of firing every row at
// once (the browser then queues them and the tail of a 100-row page can hit the 15s timeout).
// Rows that unmount while waiting have an aborted signal, so their turn rejects instantly.
const MAX_ACTIVE = 4;
const waiting = [];
let active = 0;

function pump() {
  while (active < MAX_ACTIVE && waiting.length) {
    active += 1;
    waiting.shift()();
  }
}

export function enqueue(task) {
  return new Promise((resolve, reject) => {
    waiting.push(() =>
      task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          pump();
        })
    );
    pump();
  });
}

// 7-day trend from Binance 4h candles; coins without a live USDT pair render `empty` instead.
function CoinSparkline({ symbol, width = 110, height = 36, empty = null }) {
  const [prices, setPrices] = useState(null);

  useAbortableEffect(
    (signal, isAlive) => {
      enqueue(() => api.get(BinanceSpark(symbol), { signal, silent: true, cacheKey: `spark-${symbol}`, cacheTtl: 600000 }))
        .then(({ data }) => isAlive() && setPrices(data.map((candle) => Number(candle[4]))))
        .catch(() => isAlive() && setPrices([]));
    },
    [symbol]
  );

  if (!prices) return <Skeleton variant="rounded" width={width} height={height} sx={{ maxWidth: "100%" }} />;
  if (prices.length < 2) return empty;
  return <Sparkline prices={prices} width={width} height={height} />;
}

export default CoinSparkline;
